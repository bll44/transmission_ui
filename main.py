from transmissionclient.transmissionclient import TransmissionClient
import cherrypy
import os
import settings
from pprint import pprint
import urllib.parse
import time

tc = TransmissionClient('localhost', 9091)

class TransmissionControl(object):

    def __init__(self):
        self.get_torrents()

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_torrents(self):
        torrents = tc.get_torrents()
        return torrents


if __name__ == '__main__':
    cherrypy.quickstart(TransmissionControl(), '/',
                        {'/': {
                            'tools.staticdir.root': settings.html_dir,
                            'tools.staticdir.on': True,
                            'tools.staticdir.dir': '',
                            'tools.staticdir.index': 'index.html'
                        },
                        'images': {
                            'tools.staticdir.on': True,
                            'tools.staticdir.dir': 'images'
                        }})
