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
    @cherrypy.tools.json_in()
    def set_session_properties(self):
        data = cherrypy.request.json
        tc.set_session_properties(data)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def quick_add_torrent(self):
        data = cherrypy.request.json
        return tc.add_torrent(data)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def set_custom_settings(self):
        data = cherrypy.request.json
        print(data)
        return tc.set_custom_settings(data)


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
                        },
                        'js': {
                            'tools.staticdir.on': True,
                            'tools.staticdir.dir': 'js'
                        }})
