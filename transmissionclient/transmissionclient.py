import transmissionrpc
import os
from urllib3.util.url import parse_url
from pprint import pprint
import json
import settings
import urllib3
import string
import random
import re


class TransmissionClient(object):

    _ROOT_DOWNLOAD_DIR = os.path.abspath('/Users/bradylatsha/transmission_client/downloads')
    _invalid_session_props = ['config_dir']

    def __init__(self, hostname, port=9091):
        """
        Opens the connection to the Transmission Client
        :param hostname: hostname of the server/computer Transmission is running on
        :param port: port the Transmission WebUI is available on (default=9091)
        """
        self.hostname = hostname
        self.port = port
        self.client = transmissionrpc.Client(self.hostname, self.port)
        self.session = transmissionrpc.Session(self.client)

    def _build_object_dict(self, object=None):
        """
        Create a python dictionary from a Transmission RPC object
        :param object: Transmission RPC object (Session, Torrent)
        :return: json compatible python dictionary containing key value pairs of rpc object
        """
        if object is not None:
            od = {}
            keys = list(object._fields.keys())
            for k in keys:
                od[k] = str(object._fields[k].value)
            return od

    def add_torrent(self, url, settings=None):
        """
        Add a torrent via URL or base64 encoded .torrent file
        :param url: the download url of the torrent to download
        :param settings: dictionary containing kwargs to pass into add_torrent method of transmissionrpc
        :return: the torrent object that was added
        """
        torrent = self.client.add_torrent(url, **settings)
        return self._build_object_dict(torrent)

    def start_torrent(self, id):
        """
        Start a torrent
        :param id: the id of the torrent to be resumed
        """
        self.client.start_torrent(id)

    def get_torrents(self):
        """
        Get the full list of torrents currently in the Transmission Client
        :return: json compatible list of all torrents currently listed in the Tranmission client
        """
        torrents = self.client.get_torrents()
        torrent_list = []
        for t in torrents:
            torrent = self._build_object_dict(t)
            torrent_list.append(torrent)
        return torrent_list

    def delete_torrent(self, torrent_id, delete_data=True):
        """
        Removes a torrent from the Transmission client
        Deletes the torrent data from the disk by default, can be overridden with delete_data=False
        :param torrent_id: id of the torrent to remove
        """
        self.client.remove_torrent(torrent_id, delete_data)

    def get_session_stats(self):
        """
        Gets the Tranmission Client session object
        :return: json compatible session object
        """
        session = self._build_object_dict(self.client.session_stats())
        return session

    def set_session_properties(self, settings=None):
        """
        Sets the Transmission Client settings
        :param settings: dictionary of client settings to be passed as **kwargs
        """
        if settings is not None:
            for p in self._invalid_session_props:
                settings.pop(p, None)
            self.client.set_session(**settings)
        self.session.update()

    def set_custom_settings(self, settings_data):
        """
        Sets custom settings outside the scope of the standard Transmission Client settings
        :param settings_data: python dictionary of settings to be converted to json for saving
        :return: returns the set of saved settings
        """
        with open(settings.custom_settings_file, 'w') as outfile:
            json.dump(settings_data, outfile)
        saved_data = open(settings.custom_settings_file, 'r').read()
        return json.loads(saved_data)

    def get_custom_settings(self):
        """
        Get the custom settings that are outside the scope of the standard Transmission Client
        :return: python dictionary in json friendly format
        """
        custom_settings = open(settings.custom_settings_file, 'r').read()
        return json.loads(custom_settings)

    def get_torrent_files(self, data):
        """
        Get the list of torrent files associated with a particular torrent
        :param data: Dictionary containing the torrent download URL
        :return: json friendly list of files associated with the torrent
        """
        url = data['torrent_download_url']
        settings = {'paused': True}
        torrent = self.add_torrent(url, settings)
        torrent_id = int(torrent['id'])
        files = self.client.get_files(torrent_id)[torrent_id]
        self.client.remove_torrent(torrent_id)
        return files


    def download_tmp_torrent(self, url):
        """
        Probably won't be using this function.
        :param url:
        :return:
        """
        try:
            http = urllib3.PoolManager()
            r = http.request('GET', url)
            filename = self._random_string() + '.torrent'
            filepath = os.path.abspath(os.path.join('/tmp', filename))
            with open(filepath, 'wb') as out:
                out.write(r.data)
            return self.get_torrent_files(filepath)
        except Exception:
            return {'error': 'invalid url or could not download file'}

    def _random_string(self, length=8):
        """
        Generate a random string of 8 characters, including upper and lower case ascii, as well as digits
        :param length: the total length of string to generate
        :return: randomly generated string
        """
        values = string.ascii_uppercase + string.ascii_lowercase + string.digits
        return ''.join(random.choice(values) for _ in range(length))