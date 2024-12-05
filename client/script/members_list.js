const membersList = document.getElementById('membersList');
const searchInput = document.getElementById('searchInput');
//update this to grab from database instead later
const members = [
    {
        name: 'Luffy Onepiece',
        email: 'luffy@mail.com',
        role: 'Lead',
        image: 'https://avatarfiles.alphacoders.com/364/364538.png'
    }
]

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm) ||
        member.email.toLowerCase().includes(searchTerm) ||
        member.role.toLowerCase().includes(searchTerm)
    );
    displayMembers(filteredMembers);
});


function displayMembers(members) {
    membersList.innerHTML = '';
            if (members.length === 0) {
                membersList.innerHTML = '<p class="not-found">No Members Found</p>';
            } else {
                members.forEach(member => {
                    const memberElement = document.createElement('div');
                    memberElement.className = 'member';
                    memberElement.innerHTML = `
                        <div class="image">
                            <img src="${member.image}" alt="">
                        </div>
                        <div class="name">
                            <p>${member.name}</p>
                            <span>${member.email}</span>
                        </div>
                        <div class="role">${member.role}</div>
                    `;
                    membersList.appendChild(memberElement);
                });
            }
}

displayMembers(members);