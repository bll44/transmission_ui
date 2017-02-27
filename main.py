from transmissionclient.transmissionclient import TransmissionClient
from pprint import pprint
import urllib.parse


def open_client():
    tc = TransmissionClient('yards01', 9091)
    url = 'http://releases.ubuntu.com/14.04/ubuntu-14.04.5-server-i386.iso.torrent?_ga=1.262345295.2111688684.1488167464'
    torrents = tc.get_torrents()
    for index, t in enumerate(torrents):
        print(str(index) + ': ' + str(t.id) + ' ----> ' + t.name)

    tc.delete_torrent(1)


if __name__ == '__main__':
    open_client()