const motionsTable = document.getElementById('motionsTable');
const tableBody = document.getElementById('tableBody');

//<Motion
//Description
//Creator
//Date

//update this to grab from database instead later
async function fetchMotions() {
  try {
      const response = await fetch('/api/motions');
      const motions = await response.json();
      loadMotionsTable(motions);
  } catch (err) {
      console.error('Error fetching motions:', err);
      const motions = [
        {
            motion_name: 'name of motion',
            description: 'desc',
            creator: 'creator', //maybe also grab this from database
            date: 'date',
            motionID: 'motionID'
        }
    ]
  }
}



function loadMotionsTable(motions) {
  //hi
  motions.forEach( item => {
    let row = tableBody.insertRow();
    row.id = item.motionKey; //set motionID as identifier

    //motion name cell
    let motion = row.insertCell(0);
      //populate cell with motion name and link to motion
    let motionLink = document.createElement('a');
    motionLink.setAttribute("href", `/chatroom/${item.motionKey}`); // Link to chatroom

    let linkText = document.createTextNode(item.title);
    motionLink.appendChild(linkText);

    motion.appendChild(motionLink);

    //description cell
    let description = row.insertCell(1);
    let descriptionText = document.createTextNode(item.description);
    description.appendChild(descriptionText);

    //creator cell
    let creator = row.insertCell(2);
    let creatorText = document.createTextNode(item.creator);
    creator.appendChild(creatorText);

    //date cell
    let date = row.insertCell(3);
    let dateText = document.createTextNode(item.date);
    date.appendChild(dateText);
  })
}



$(document).ready(function() {
  function cbDropdown(column) {
    return $('<ul>', {
      'class': 'cb-dropdown'
    }).appendTo($('<div>', {
      'class': 'cb-dropdown-wrap'
    }).appendTo(column));

  }

  $('#motionsTable').DataTable({
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
loadMotionsTable(motions);
