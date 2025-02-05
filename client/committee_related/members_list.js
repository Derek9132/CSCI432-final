const membersList = document.getElementById('membersList');
const searchInput = document.getElementById('searchInput');
//update this to grab from database instead later

async function fetchUsersByCommittee()
{
  //get committee key from url
  const queryParams = new URLSearchParams(window.location.search);
  const committeeKey = queryParams.get('committeeKey');

  //fetch motions by committee(key)
  const usersByCommittee = await fetch(`${server}/api/committee/${committeeKey}/users`);
  if (usersByCommittee.ok)
  {
    //load associated motions into table
    const res = await usersByCommittee.json();
    const members = res.committeeMembers;

    //address possible null stuff in data (should not be an issue later when fields are required)
    members.forEach(member => {
        const memberElement = document.createElement('div');
        //if no pfp set use Archer bc i like archer (can update to be default later)
        if (member.pfpPath == null || member.pfpPath == undefined || member.pfpPath == "" || member.pfpPath == "null") {
            member.pfpPath = 'https://pbs.twimg.com/media/FvxFbd1WwAArtpE.png';
        }
        //just for fun

        else
        {
            
            //setup path to pfp (should find out how to upload default pfp to server so consistent retrieval)
            let path = `http://127.0.0.1:5500/server/${member.pfpPath}`;
            member.pfpPath = path;
            if (member.firstName == "Luffy") {
                member.pfpPath = 'https://avatarfiles.alphacoders.com/364/364538.png';
            }
            if (member.firstName == "Ar") { 
                member.pfpPath = 'https://pbs.twimg.com/media/FvxFbd1WwAArtpE.png';
            }
            if (member.firstName == "Blitz") {
                member.pfpPath = 'https://www.giantbomb.com/a/uploads/scale_medium/8/89064/1334837-312e302e302e38322d3533.jpg';
            }
        }
        //if no first/last name specified for some reason
        if (member.firstName == null || member.firstName == undefined || member.firstName == "" || member.firstName == "undefined") {
            member.firstName = "Archer";
        }
        if (member.lastName == null || member.lastName == undefined || member.lastName == "" || member.lastName == "undefined") {
            member.lastName = "";
        }
    });
    //console.log("meow", members);

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredMembers = members.filter(member =>
            member.firstName.toLowerCase().includes(searchTerm) ||
            member.lastName.toLowerCase().includes(searchTerm) ||
            member.email.toLowerCase().includes(searchTerm)
        );            //member.role.toLowerCase().includes(searchTerm)

        displayMembers(filteredMembers);
    });

    //populate mems list
    displayMembers(members);
  }
  else
  {
    console.log("failed to fetch users by committee");
  }
}

// const members = [
//     {
//         name: 'Luffy Onepiece',
//         email: 'luffy@mail.com',
//         role: 'Lead',
//         image: 'https://avatarfiles.alphacoders.com/364/364538.png'
//     }
// ]



//  userKey
//  username
//  firstName
//  lastName
//  email
//  pfpPath
function displayMembers(members) {
    console.log();
    membersList.innerHTML = '';
            if (members.length === 0) {
                membersList.innerHTML = '<p class="not-found">No Members Found</p>';
                } else {
                members.forEach(member => {
                    const memberElement = document.createElement('div');
                    
                    memberElement.className = 'member';
                    memberElement.innerHTML = `
                        <div class="image">
                            <img src="${member.pfpPath}" alt="">
                        </div>
                        <div class="name">
                            <p>${member.firstName} ${member.lastName}</p>
                            <span><a href="mailto:${member.email}">${member.email}</a></span>
                        </div>
                        <div class="role"> </div>
                    `;// <div class="role">${member.role}</div>
                    membersList.appendChild(memberElement);
                });
            }
}



fetchUsersByCommittee();