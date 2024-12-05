$(document).ready(function() {
    function cbDropdown(column) {
      return $('<ul>', {
        'class': 'cb-dropdown'
      }).appendTo($('<div>', {
        'class': 'cb-dropdown-wrap'
      }).appendTo(column));
  
    }
  
    $('#data_table').DataTable({
      bAutoWidth: false, 
      aoColumns : [
        { sWidth: '25%' }, //org
        { sWidth: '25%' }, //filename
        { sWidth: '25%' }, //year
        { sWidth: '25%' }, //edition
      ],
      responsive: true,
      columnDefs: [
        {
          targets: 0,
          render: function (data, type, row) {
            if (type === 'filter') {
              if ( data.includes( 'href' ) ) {
                return $(data).text();
              }
              return data;
            }
            return data;
          }
        }
      ],
      initComplete: function() {
        this.api()
        .columns()
        .every(function(index) 
        {
  
                  var column = this;
                  var ddmenu = cbDropdown($(column.header()))
                    .on('change', ':checkbox', function() {
                      var active;
                      var vals = $(':checked', ddmenu).map(function(index, element) {
                        active = true;
                        return $.fn.dataTable.util.escapeRegex($(element).val());
                      }).toArray().join('|');
          
                      column
                        .search(vals.length > 0 ? '^(' + vals + ')$' : '', true, false)
                        .draw();
          
                      // Highlight the current item if selected.
                      if (this.checked) {
                        $(this).closest('li').addClass('active');
                      } else {
                        $(this).closest('li').removeClass('active');
                      }
          
                      // Highlight the current filter if selected.
                      var active2 = ddmenu.parent().is('.active');
                      if (active && !active2) {
                        ddmenu.parent().addClass('active');
                      } else if (!active && active2) {
                        ddmenu.parent().removeClass('active');
                      }
                    });
          
                  //. Keep track of the select options to not duplicate
                  var selectOptions = [];
                  column.data().unique().sort().each(function(d, j) {
                    
                    // Use jQuery to get the text if the cell is a link
                    if ( d.includes( 'href' ) ) {
                      d = $(d).text();
                    }
                    
                    if ( ! selectOptions.includes( d ) ) {
                      
                      selectOptions.push( d );
                      
                      var // wrapped
                      $label = $('<label>'),
                          $text = $('<span>', {
                            text: d
                          }),
                          $cb = $('<input>', {
                            type: 'checkbox',
                            value: d
                          });
          
                      $text.appendTo($label);
                      $cb.appendTo($label);
          
                      ddmenu.append($('<li>').append($label));
                    }
                  });
         
        });
      }
    });
  });
  
  