import tempfile
import unittest
from pathlib import Path
from safe_inputs import image_inventory, select_image, cloud_image_url, local_api_url, NoRedirect

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

if __name__ == '__main__': unittest.main()
