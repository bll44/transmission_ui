/********* Global properties *********/
var client_settings = {};
var custom_settings = {};
var checked_row_color = 'warning'; // color each row will turn when its checkbox is checked
var async_url = window.location.protocol + '//' + window.location.host;
/*************************************/

var load_config = function(callback=function(){}) {
  $.get({
    url: async_url + '/get_session_stats',
    dataType: 'json',
    success: function(data) {
      for(i in data) {
        client_settings[i] = data[i];
      }

      $.get({
        url: async_url + '/get_custom_settings',
        dataType: 'json',
        success: function(data) {
          for(i in data) {
            custom_settings[i] = data[i];
          }
          // loads the torrent panel first.
          callback.call();
        }
      });
    }
  });
}

var torrent_checkboxes;
var loadCheckBoxes = function() {
  var lastChecked = null;
  torrent_checkboxes = $('.torrent-checkbox');
  torrent_checkboxes.click(function(e) {
    if( ! lastChecked) {
      lastChecked = this;
      return;
    }

    if(e.shiftKey) {
      var start = torrent_checkboxes.index(this);
      var end = torrent_checkboxes.index(lastChecked);

      torrent_checkboxes.slice(Math.min(start,end), Math.max(start,end)+ 1).prop('checked', lastChecked.checked);
      toggleRowHighlight();
    }

    lastChecked = this;
  });
  $('.torrent-checkbox').on('change', function() {
    toggleRowHighlight();
  });
}

var loadTorrentPanel = function(callback) {
  $('#torrent-panel').removeClass('hidden');
  $.get({
    url: async_url + '/get_torrents',
    dataType: 'json',
    success: function(torrents) {
      for(t in torrents) {
        torrent = torrents[t];
        var checkbox_td = $('<td>', {'class': 'checkbox-td'});
        var checkbox_input = $('<input>', {'type': 'checkbox', 'class': 'torrent-checkbox'});
        checkbox_td.append(checkbox_input)

        /***** Build the 'progress' table cell *****/
        progress_percent_value = (torrent.percentDone * 100).toFixed(2);
        progress_td = $('<td>', {'class': 'td-progress'});
        progress_wrapper_div = $('<div>', {'class': 'progress'});
        progressbar_div = $('<div>', {'class': 'progress-bar', 'role': 'progressbar', 'aria-valuenow': progress_percent_value,
                                      'aria-valuemin': '0', 'aria-valuemax': '100', 'style': 'width: ' + progress_percent_value + '%;'});
        progressbar_span = $('<span>', {'class': '', 'text': progress_percent_value + '%'});
        // combine the separate elements for insertion
        progress_td.append(progressbar_span).append(progress_wrapper_div.append(progressbar_div));

        /***** Build the 'status' table cell *****/
        switch(torrent.status) {
          case '0':
            status_text = 'Paused';
            break;
          case '4':
            status_text = 'Downloading';
            break;
          case '6':
            status_text = 'Seeding';
            break;
          default:
            status_text = 'unknown';
        }
        status_td = $('<td>', {'class': 'td-torrent-status', 'text': status_text});

        /***** Create a list of table cells to be appended to the table row later *****/
        var tds = [
          $(checkbox_td),
          $('<td>', {'text': (parseInt(t) + 1), 'class': 'td-torrent-num'}),
          $('<td>', {'text': torrent.name, 'class': 'td-torrent-name'}),
          $(status_td),
          $(progress_td),
          $('<td>', {
            'class': 'td-torrent-dateAdded',
            'text': function() {
              var date = new Date(parseInt(torrent.addedDate) * 1000);
              return date.getFullYear() + '/' + parseInt(date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
            },
          }),
        ];

        var tr = $('<tr>', {'data-torrent-id': torrent.id});
        for(i in tds) {
          tr.append(tds[i]);
        }
        $('#torrent-list-tablebody').append(tr);
      }
      callback() // callback necessary to attach events to torrent list once completely loaded
    }
  });
}

// Gets session settings, populates the settings modal, then executes callback();
var populateSettings = function(callback=function(){}) {
  var id, setting_value, key, settings;
  // Get the settings
  load_config(function() {
    settings = client_settings;
    var input_ids = [];
    $('.settings-form input').each(function() {
      input_ids.push($(this).attr('id'));
    });
    for(i in input_ids) {
      key = input_ids[i];
      $('#' + key).val(settings[key]);
    }

    // populate the select fields in a similar fashion to the way the input fields are populated
    select_ids = [];
    $('.settings-form select').each(function() {
      select_ids.push($(this).attr('id'));
    });
    for(i in select_ids) {
      key = select_ids[i];
      setting_value = settings[key].toLowerCase();
      $('#' + select_ids[i]).each(function() {
        options = $(this).children();
        options.each(function() {
          if($(this).val().toLowerCase() == setting_value) {
            $(this).prop('selected', 'true');
          }
        })
      });
    }

    $('.custom-settings-form input, .custom-settings-form select').each(function() {
      id = $(this).attr('id');
      setting_value = custom_settings[id];
      // element_ids.push($(this).attr('id'));
      if($(this).prop('tagName').toLowerCase() == 'select') {

        options = $(this).children();
        options.each(function() {
          if($(this).val().toLowerCase() == setting_value) {
            $(this).prop('selected', 'true');
          }
        });
      } else if($(this).prop('tagName').toLowerCase() == 'input') {
        $(this).val(setting_value);
      }
    });
    // display the settings modal
    $('#settingsModal').modal('show');

    // if there is a callback passed in, call it.
    callback.call();
  });
}

/***** Save client settings when 'Save Changes' button is clicked in the settingsModal *****/
var saveSettings = function(callback=function(){}) {
  var settings;
  settings = {};
  $('.settings-form input, .settings-form select').each(function() {

    key = $(this).attr('id');
    if($(this).prop('tagName').toLowerCase() == 'select') {
      // if the element is a <select> tag
      options = $(this).children();
      options.each(function() {
        if($(this).prop('selected')) {
          settings[key] = $(this).val();
        }
      });
    } else if($(this).prop('tagName').toLowerCase() == 'input') {
      // if the element is a <input> tag
      settings[key] = $(this).val();
    }
  });
  var settings_json_string = JSON.stringify(settings);
  $('#save-settings-btn').html('<i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i>');
  $.ajax({
    url: async_url + '/set_session_properties',
    type: 'POST',
    contentType: 'application/json',
    data: settings_json_string,
    success: function(data, status, xhr) {
      if(xhr.status == 200) {
        callback.call();
      } else {
        var alert = $('<div>', {'class': 'alert alert-danger alert-dismissible', 'role': 'alert', 'id': 'settings-save-error-alert'});
        var dismiss_btn = $('<button>', {'type': 'button', 'class': 'close', 'data-dismiss': 'alert', 'aria-label': 'Close'});
        var dismiss_btn_span = $('<span>', {'aria-hidden': 'true', 'html': '&times;'});
        var alert_strong_text = $('<strong>', {'html': '<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;&nbsp;'});
        var alert_description = 'An unknown error occurred when trying to save your settings.';
        $('#settingsModal .modal-body').append(alert.append(dismiss_btn.append(dismiss_btn_span)).append(alert_strong_text).append(alert_description));
      }
      load_config();
    },
    error: function(xhr, textStatus, error) {
      // add error alert to modal if the request fails...
      var alert = alertElement({
        'type': 'danger',
        'id': 'settings-save-error-alert',
        'text': 'Saving your settings failed for the following reason: <b>' + xhr.status + ' ' + error + '</b>' +
                '<br>This usually means your Transmission client is not running, or the web interface is not enabled.',
      });
      $('#settingsModal .modal-body').append(alert);
    }
  });

} // end saveSettings function

var saveCustomSettings = function(callback=function(){}) {
  var settings, key, options, settings_json_string;
  settings = {};
  $('.custom-settings-form select, .custom-settings-form input').each(function() {
    key = $(this).attr('id');
    if($(this).prop('tagName').toLowerCase() == 'select') {
      // if the element is a <select> tag
      options = $(this).children();
      options.each(function() {
        if($(this).prop('selected')) {
          settings[key] = $(this).val();
        }
      });
    } else if($(this).prop('tagName').toLowerCase() == 'input') {
      // if the element is a <input> tag
      settings[key] = $(this).val();
    }
  });
  settings_json_string = JSON.stringify(settings);
  $.post({
    url: async_url + '/set_custom_settings',
    contentType: 'application/json',
    data: settings_json_string,
    success: function(data, status, xhr) {
      save_btn = $('#save-settings-btn');
      if(xhr.status == 200) {
        save_btn.attr('disabled', true)
                .removeClass('btn-primary')
                .addClass('btn-success')
                .html('<span class="glyphicon glyphicon-ok-circle" aria-hidden="true"></span>&nbsp;&nbsp;Settings Saved Successfully!');
        setTimeout(function() {
          callback.call();
        }, 900);
      } else {
        var alert = $('<div>', {'class': 'alert alert-danger alert-dismissible', 'role': 'alert', 'id': 'settings-save-error-alert'});
        var dismiss_btn = $('<button>', {'type': 'button', 'class': 'close', 'data-dismiss': 'alert', 'aria-label': 'Close'});
        var dismiss_btn_span = $('<span>', {'aria-hidden': 'true', 'html': '&times;'});
        var alert_strong_text = $('<strong>', {'html': '<span class="glyphicon glyphicon-exclamation-sign"></span>&nbsp;&nbsp;'});
        var alert_description = 'An unknown error occurred when trying to save your settings.';
        $('#settingsModal .modal-body').append(alert.append(dismiss_btn.append(dismiss_btn_span)).append(alert_strong_text).append(alert_description));
      }
      load_config();
    },
    error: function(xhr, textStatus, error) {
      // add error alert to modal if the request fails...
      var alert = alertElement({
        'type': 'danger',
        'id': 'settings-save-error-alert',
        'text': 'Saving your settings failed for the following reason: <b>' + xhr.status + ' ' + error + '</b>' +
                '<br>This usually means your Transmission client is not running, or the web interface is not enabled.',
      });
      $('#settingsModal .modal-body').append(alert);
    }
  });
}

/***** Add torrent functions *****/
var quick_add_torrent = function(url, callback=function(){}) {
  $.ajax({
    url: async_url + '/quick_add_torrent',
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({torrent_download_url: url}),
    success: function(data, status, xhr) {
      if(xhr.status == 200) {
        alert = alertElement({
          'type': 'success',
          'id': '',
          'text': 'Torrent "' + data.name + '" successfully added'
        })
        $('#main-alert-container').append(alert);
      }
    }
  })
  callback.call()
}

$('#quick-add-torrent-btn').click(function() {
  var torrent_download_url = $('#torrent-url-input').val();
  quick_add_torrent(torrent_download_url);
});



function uncheckAllRows() {
  $('.torrent-checkbox').each(function() {
    $(this).prop('checked', false);
    $(this).parent().parent().removeClass(checked_row_color);
  });
}

function checkAllRows() {
  $('.torrent-checkbox').each(function() {
    $(this).prop('checked', true);
    $(this).parent().parent().addClass(checked_row_color);
  })
}

function toggleRowHighlight() {
  $('.torrent-checkbox').each(function() {
    var parent_row = $(this).parent().parent();
    if($(this).prop('checked')) {
      parent_row.addClass(checked_row_color);
    } else {
      parent_row.removeClass(checked_row_color);
    }
  });
}

var alertElement = function(alertOptions) {
  var options = {
    'type': 'alert-' + alertOptions['type'],
    'id': alertOptions['id'],
    'text': alertOptions['text'],
  };
  var success_icon = 'glyphicon-ok-circle';
  var error_icon = 'glyphicon-exclamation-sign';
  if(alertOptions['type'] == 'success') {
    var icon = success_icon;
  } else if (alertOptions['type'] == 'danger') {
    var icon = error_icon;
  }
  var alert = $('<div>', {'class': 'alert ' + options['type'] + ' ' + options['dismissible'], 'role': 'alert', 'id': options['id']});
  var dismiss_btn = $('<button>', {'type': 'button', 'class': 'close', 'data-dismiss': 'alert', 'aria-label': 'Close'});
  var dismiss_btn_span = $('<span>', {'aria-hidden': 'true', 'html': '&times;'});
  var alert_strong_text = $('<strong>', {'html': '<span class="glyphicon ' + icon + '"></span>&nbsp;&nbsp;'});
  var alert_description = options['text'];
  return alert.append(dismiss_btn.append(dismiss_btn_span)).append(alert_strong_text)
                                                           .append(alert_description);
}

var updateDiskFreeSpaceDisplays = function() {
  var free_space = (client_settings['download_dir_free_space'] / 1000000000).toFixed(2);
  if(free_space >= 150) {
    var textClass = 'text-success';
  } else if(free_space >= 75) {
    var textClass = 'text-warning';
  } else {
    var textClass = 'text-danger';
  }
  var free_space_elements = $('.disk-free-space');
  free_space_elements.each(function() {
    $(this).removeClass().addClass('.disk-free-space');
    $(this).addClass(textClass);
    $(this).text(free_space + ' GB');
  });
}

var displayMainError = function(errorText) {
  var alert = alertElement({
    'type': 'danger',
    'id': '',
    'text': errorText,
  });
  $('#main-alert-container').append(alert);
}

$('#check-all-boxes').click(function() {
  if($(this).prop('checked')) {
    checkAllRows();
  } else {
    uncheckAllRows();
  }
});

$('#client-settings-btn').click(function() {
  populateSettings(function() {
    $('#settingsModal').modal();
  });
});

$('#save-settings-btn').click(function() {
  saveSettings(function() {
    saveCustomSettings(function() {
      $('#settingsModal').modal('hide');
    });
  });
});

var setDownloadCompleteDir = function(byHostname) {
  var torrent_url_textbox = $('#torrent_url_w_options');
  var download_dir = client_settings['download_dir'];
  var download_url = torrent_url_textbox.val();
  if(download_url.replace(/ /g, '').length <= 0) {
    $('#download-complete-location').text(download_dir);
    return false;
  }
  $('#add-torrent-options-container').removeClass('hidden');
  if(byHostname) {
    if(download_url.length > 0) {
      var url = document.createElement('a');
      url.href = download_url;
      last_index = download_dir[download_dir.length - 1];
      if($('#sort-by-site-checkbox').prop('checked')) {
        if(last_index == '/' || last_index == '\\') {
          dl_complete_dir = download_dir + url.hostname;
        } else {
          dl_complete_dir = download_dir + '/' + url.hostname;
        }
        $('#download-complete-location').text(dl_complete_dir);
      }
    }
  } else {
    var custom_dir = $('#custom-download-dir').val();
    last_index = download_dir[download_dir.length - 1];
    if( ! $('#sort-by-site-checkbox').prop('checked')) {
      if(last_index == '/' || last_index == '\\') {
        dl_complete_dir = download_dir + custom_dir;
      } else {
        dl_complete_dir = download_dir + '/' + custom_dir;
      }
      $('#download-complete-location').text(dl_complete_dir);
    }
  }
}

$('#torrent_url_w_options, #custom-download-dir').on('input', function() {
  if($('#sort-by-site-checkbox').prop('checked')) {
    setDownloadCompleteDir(true);
  } else {
    setDownloadCompleteDir(false);
  }
});

$('#addWithOptionsModal').on('show.bs.modal', function(e) {
  var options_container = $('#add-torrent-options-container');
  if( ! options_container.hasClass('hidden')) {
    options_container.addClass('hidden');
  }
  if(client_settings['incomplete_dir_enabled'] == 'True') {
    $('#location-while-downloading').text(client_settings['incomplete_dir']);
  } else {
    $('#location-while-downloading').text(client_settings['download_dir']);
  }
  $('#download-complete-location').text(client_settings['download_dir']);

  $('#sort-by-site-checkbox').prop('checked', (custom_settings['default_sort_by_site'].toLowerCase() == 'true'));
  if(custom_settings['default_sort_by_site'].toLowerCase() == 'true') {
    $('#custom-download-dir').hide();
  } else {
    $('#custom-download-dir').show();
  }
});
$('#addWithOptionsModal').on('hide.bs.modal', function(e) {
  $('#torrent_url_w_options').val('');
  $('#custom-download-dir').val('');
});

$('#add-with-options').click(function() {
  updateDiskFreeSpaceDisplays();
  $('#addWithOptionsModal').modal('show');
});

$('#sort-by-site-checkbox').on('change', function() {
  if($(this).prop('checked')) {
    $('#custom-download-dir').val('');
    $('#custom-download-dir').hide();
    setDownloadCompleteDir(true);
  } else {
    $('#custom-download-dir').show();
    $('#download-complete-location').text(client_settings['download_dir']);
  }
});

/***** Actions to perform when the settings modal is hidden, canceled, or settings are saved *****/
$('#settingsModal').on('hidden.bs.modal', function(e) {
  save_settings_btn = $('#save-settings-btn');
  save_settings_btn.removeClass()
                   .addClass('btn btn-primary')
                   .html('Save changes')
                   .attr('disabled', false);
  if($('#settings-save-error-alert').length > 0) $('#settings-save-error-alert').remove();
});

/************ ENTRY POINT ***********/
var init_app = function() {
  load_config(function() {
    loadTorrentPanel(loadCheckBoxes);
  });
}
// start the application
$(function() {
  init_app();
});