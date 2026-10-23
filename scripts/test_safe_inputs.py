import tempfile
import unittest
from pathlib import Path
from safe_inputs import image_inventory, select_image, cloud_image_url, local_api_url, NoRedirect, ImageOutputs, check_cloud_image

class InputBoundariesTest(unittest.TestCase):
    def test_images_only_from_inventory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'player.png').write_bytes(b'image')
            inventory = image_inventory(root)
            self.assertEqual(select_image(inventory, '/uploads/players/player.png'), root / 'player.png')
            for name in ('%2e%2e%2fsecret.png', '%2e%2e%5csecret.png', 'C%3Asecret.png', 'absent.png', 'photo.png%00'):
                with self.subTest(name=name), self.assertRaises(ValueError):
                    select_image(inventory, '/uploads/players/' + name)
    def test_cloud_url_boundary(self):
        url = 'https://res.cloudinary.com/caza/image/upload/v123/photo.png'
        self.assertEqual(cloud_image_url(url, 'caza'), url)
        for bad in ('http://127.0.0.1/a', 'https://res.cloudinary.com.evil.test/caza/image/upload/a',
                    'https://res.cloudinary.com@127.0.0.1/a', url + '?next=http://localhost',
                    url.replace('photo.png', '%2e%2e/secret'), url.replace('/caza/', '/other/')):
            with self.subTest(url=bad), self.assertRaises(ValueError): cloud_image_url(bad, 'caza')
    def test_test_api_boundary(self):
        base = 'http://localhost:18081/api'
        self.assertEqual(local_api_url(base, '/players/42/stats/9'), 'http://127.0.0.1:18081/api/players/42/stats/9')
        for path in ('//evil.test/x', '/players/../admin', '/players/1/other', '/players/%2fadmin', 'https://evil.test'):
            with self.subTest(path=path), self.assertRaises(ValueError): local_api_url(base, path)
        with self.assertRaises(ValueError): local_api_url('https://caza-fifa.onrender.com/api', '/players')
    def test_redirects_are_rejected(self):
        with self.assertRaises(ValueError): NoRedirect().redirect_request(None, None, 302, '', {}, 'http://localhost')

class OutputBoundaryTest(unittest.TestCase):
    def test_fixed_names_and_atomic_replacement(self):
        with tempfile.TemporaryDirectory() as directory:
            output = ImageOutputs(directory)
            output.write('apply-images.sql', 'first')
            output.write('apply-images.sql', 'second')
            self.assertEqual((Path(directory) / 'apply-images.sql').read_text(), 'second')
            for name in ('../escape.sql', '/escape.sql', 'other.sql'):
                with self.assertRaises(ValueError): output.write(name, 'blocked')
            self.assertEqual(list(Path(directory).glob('.caza-*')), [])

    def test_symlink_output_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            target = root / 'outside.txt'
            target.write_text('unchanged')
            output = ImageOutputs(root / 'outputs')
            try: (output.root / 'apply-images.sql').symlink_to(target)
            except OSError: self.skipTest('OS does not allow symlinks for this account')
            with self.assertRaises(ValueError): output.write('apply-images.sql', 'blocked')
            self.assertEqual(target.read_text(), 'unchanged')

    def test_image_check_fixed_origin_and_redirect_rejection(self):
        from unittest.mock import patch
        with patch('http.client.HTTPSConnection') as client:
            response = client.return_value.getresponse.return_value
            response.status = 200
            response.getheader.return_value = 'image/png'
            url = 'https://res.cloudinary.com/caza/image/upload/v1/photo.png'
            self.assertEqual(check_cloud_image(url), url)
            client.assert_called_with('res.cloudinary.com', timeout=30)
            client.return_value.request.assert_called_with('HEAD', '/caza/image/upload/v1/photo.png')
            response.status = 302
            with self.assertRaises(ValueError): check_cloud_image(url)

if __name__ == '__main__': unittest.main()
