import transmissionrpc
import os
import urllib.parse


class TransmissionClient(object):

    _ROOT_DOWNLOAD_DIR = '/Users/bradylatsha/transmission_client/downloads'

    def __init__(self, hostname, port=9091):
        """
        Opens the connection to the Transmission Client
        :param hostname: hostname of the server/computer Transmission is running on
        :param port: port the Transmission WebUI is available on (default=9091)
        """
        self.hostname = hostname
        self.port = port
        self.connect()

    def connect(self):
        self.client = transmissionrpc.Client(self.hostname, self.port)

    def add_torrent(self, url):
        """
        :param url: the download url of the torrent to download
        :return: torrent object that was just added
        """
        sub_download_dir = urllib.parse.urlsplit(url).hostname
        download_dir = self._ROOT_DOWNLOAD_DIR + '/' + sub_download_dir
        torrent = self.client.add_torrent(url, paused=True, download_dir=download_dir)
        self.start_torrent(torrent.id)
        return torrent

    def start_torrent(self, torrent_id):
        """
        :param torrent_id: id of the torrent to be started
        """
        self.client.start_torrent(torrent_id)

    def get_torrents(self):
        """
        :return: a list of all torrents in JSON format currently available in the client
        """
        torrents = self.client.get_torrents()
        torrent_list = []
        for t in torrents:
            torrent = {}
            keys = list(t._fields.keys())
            t_dict = t.__dict__
            for k in keys:
                torrent[k] = str(t_dict['_fields'][k].value)
            torrent_list.append(torrent)
        return torrent_list

    def delete_torrent(self, torrent_id, delete_data=True):
        """
        Removes a torrent from the Transmission client
        Deletes the torrent data from the disk by default, can be overridden with delete_data=False
        :param torrent_id: id of the torrent to remove
        """
        self.client.remove_torrent(torrent_id, delete_data)