import transmissionrpc
import os
import urllib.parse


class TransmissionClient(object):

    _ROOT_DOWNLOAD_DIR = '/downloads'

    def __init__(self, hostname, port):
        self.hostname = hostname
        self.port = port
        self.connect()

    def connect(self):
        self.client = transmissionrpc.Client(self.hostname, self.port)

    def add_torrent(self, url):
        sub_download_dir = urllib.parse.urlsplit(url).hostname
        download_dir = self._ROOT_DOWNLOAD_DIR + '/' + sub_download_dir
        torrent = self.client.add_torrent(url, paused=True, download_dir=download_dir)
        self.start_torrent(torrent.id)
        return torrent

    def start_torrent(self, torrent_id):
        self.client.start_torrent(torrent_id)

    def get_torrents(self):
        return self.client.get_torrents()

    def delete_torrent(self, torrent_id):
        self.client.remove_torrent(torrent_id, delete_data=True)