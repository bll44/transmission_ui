from transmissionclient.transmissionclient import TransmissionClient
import cherrypy
import os
import settings
from pprint import pprint
import urllib.parse

tc = TransmissionClient('localhost', 9091)

class TransmissionControl(object):

    # @cherrypy.expose
    def index(self):
        pass
        # return open(os.path.join(settings.html_dir, 'index.html'), 'r').read()

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def generate(self):
        torrents = tc.get_torrents()
        torrent_list = []
        for index, t in enumerate(torrents):
            torrent = {
                'id': t.id,
                'name': t.name
            }
            torrent_list.append(torrent)
        return torrent_list

def open_client():
    url = 'http://releases.ubuntu.com/14.04/ubuntu-14.04.5-server-i386.iso.torrent?_ga=1.262345295.2111688684.1488167464'
    torrents = tc.get_torrents()
    for index, t in enumerate(torrents):
        print(str(index) + ': ' + str(t.id) + ' ----> ' + t.name)

    tc.delete_torrent(1)


if __name__ == '__main__':
    cherrypy.quickstart(TransmissionControl(), '/',
                        {'/': {
                            'tools.staticdir.root': settings.html_dir,
                            'tools.staticdir.on': True,
                            'tools.staticdir.dir': '',
                            'tools.staticdir.index': 'index.html'
                        }})