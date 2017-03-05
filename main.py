from transmissionclient.transmissionclient import TransmissionClient
import cherrypy
import os
import settings
from pprint import pprint
import urllib.parse
import time

tc = TransmissionClient('localhost', 9091)

class TransmissionUI(object):

    def __init__(self):
        self.get_torrents()

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_torrents(self):
        torrents = tc.get_torrents()
        return torrents

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_session_stats(self):
        return tc.get_session_stats()

    @cherrypy.expose
    def set_session_properties(self):
        tc.set_session_properties()
        return 'stats set successfully'


if __name__ == '__main__':
    cherrypy.quickstart(TransmissionUI(), '/',
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
