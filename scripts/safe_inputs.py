"""Validation boundaries for local tools. Network redirects are deliberately refused."""
import pathlib
import re
import urllib.parse
import urllib.request

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Redirect refused; verify the destination explicitly')

HTTP = urllib.request.build_opener(NoRedirect())

def image_inventory(root):
    root = pathlib.Path(root).resolve(strict=True)
    result = {}
    for entry in root.iterdir():
        if entry.is_symlink() or not entry.is_file():
            continue
        resolved = entry.resolve(strict=True)
        if resolved.parent == root and re.fullmatch(r'[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)', entry.name, re.I):
            result[entry.name] = resolved
    return result

def select_image(inventory, url):
    path = urllib.parse.urlsplit(url).path
    name = urllib.parse.unquote(path.rsplit('/', 1)[-1])
    if not re.fullmatch(r'[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)', name, re.I):
        raise ValueError('Unsafe image filename')
    if name not in inventory:
        raise ValueError('Image is absent from the approved uploads directory')
    return inventory[name]

def cloud_image_url(value, cloud=None):
    if not isinstance(value, str) or len(value) > 2048:
        raise ValueError('Invalid image URL')
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme != 'https' or parsed.netloc != 'res.cloudinary.com' or parsed.query or parsed.fragment:
        raise ValueError('Only direct Cloudinary HTTPS images are allowed')
    parts = parsed.path.split('/')
    if len(parts) < 5 or parts[2:4] != ['image', 'upload'] or (cloud and parts[1] != cloud):
        raise ValueError('Unexpected image account or resource type')
    if any(not re.fullmatch(r'[A-Za-z0-9_.-]+', part) or part in ('.', '..') for part in parts[1:]):
        raise ValueError('Unsafe image URL path')
    return 'https://res.cloudinary.com/' + '/'.join(parts[1:])

def local_api_url(base, path):
    parsed = urllib.parse.urlsplit(base)
    if parsed.scheme != 'http' or parsed.hostname not in ('127.0.0.1', 'localhost') or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path != '/api':
        raise ValueError('Only isolated local /api servers are allowed')
    route = urllib.parse.urlsplit(path)
    if route.scheme or route.netloc or route.fragment or not route.path.startswith('/'):
        raise ValueError('Invalid API route')
    # IDs received from JSON must never introduce another path or query.
    allowed = r'/(?:auth/(?:login|register)|jugadores(?:/[0-9]+)?|players(?:/[0-9]+(?:/(?:imagen|stats(?:/[0-9]+)?))?)?|player-change-requests(?:/(?:pending-count|[0-9]+/resolve))?|admin/audit)'
    if not re.fullmatch(allowed, route.path):
        raise ValueError('Unexpected API route')
    port = parsed.port or 80
    return f'http://127.0.0.1:{port}/api' + route.path + ('?' + route.query if route.query else '')


def check_cloud_image(value, cloud=None):
    """HEAD against a fixed HTTPS origin; never follow redirects from stored data."""
    import http.client
    url = cloud_image_url(value, cloud)
    target = urllib.parse.urlsplit(url).path
    connection = http.client.HTTPSConnection('res.cloudinary.com', timeout=30)
    try:
        connection.request('HEAD', target)
        response = connection.getresponse()
        if response.status != 200 or not response.getheader('Content-Type', '').startswith('image/'):
            raise ValueError('Cloudinary image is unavailable or not an image')
    finally:
        connection.close()
    return url


class ImageOutputs:
    """Fixed filenames, confined directory and exclusive temporary files for output."""
    names = frozenset(('image-manifest.json', 'apply-images.sql', 'rollback-images.sql', 'image-url-map.json'))

    def __init__(self, directory):
        import os
        candidate = pathlib.Path(directory).absolute()
        import stat
        for part in (candidate, *candidate.parents):
            if part.is_symlink():
                raise ValueError('Output directory must not contain links')
            if part.exists() and getattr(part.lstat(), 'st_file_attributes', 0) & getattr(stat, 'FILE_ATTRIBUTE_REPARSE_POINT', 0):
                raise ValueError('Output directory must not contain reparse points')
        candidate.mkdir(parents=True, exist_ok=True)
        self.root = candidate.resolve(strict=True)

    def path(self, name):
        if name not in self.names:
            raise ValueError('Unexpected output filename')
        target = self.root / name
        if target.is_symlink() or target.resolve().parent != self.root:
            raise ValueError('Output file escapes the selected directory')
        return target

    def read_manifest(self):
        import json
        target = self.path('image-manifest.json')
        return json.loads(target.read_text(encoding='utf-8')) if target.exists() else {}

    def write(self, name, content):
        import os
        import tempfile
        target = self.path(name)
        # mkstemp creates a new file exclusively; an existing link cannot redirect it.
        descriptor, temporary = tempfile.mkstemp(prefix='.caza-', dir=self.root)
        try:
            with os.fdopen(descriptor, 'w', encoding='utf-8') as output:
                output.write(content)
            self.path(name)
            os.replace(temporary, target)
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
