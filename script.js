const perkDatabase = [
    { name: 'ผู้รอดชีวิต', desc: 'ถ้าถูกฆ่าตายมีโอกาสกลับไปที่แคมป์', chance: '30%' },
    { name: 'บ้าคลั่ง', desc: 'เลือด <50% +1 dice', chance: '20%' },
    { name: 'นักวางกับดัก', desc: 'ฝ่ายป้องกัน +1 dice', chance: '20%' },
    { name: 'นักบุกโจมตี', desc: 'ฝ่ายโจมตี +1 dice', chance: '20%' },
    { name: 'อึดถึกทน', desc: 'ลดดาเมจ 20%', chance: '30%' },
    { name: 'ฟื้นตัวไว', desc: 'Heal 10% maxHP หลังรอบ', chance: '10%' },
    { name: 'หลอกล่อ', desc: 'ลด dice ฝ่ายตรงข้าม 1', chance: '20%' },
    { name: 'ผู้มีบุญ', desc: 'HP=0 ไม่ตาย และ heal ตัวเอง 20%', chance: '10%' },
    { name: 'หัวหน้าทีม', desc: 'Heal ทีม 10% maxHP หลังรอบ', chance: '10%' },
    { name: 'ฆาตกรโรคจิต', desc: '+2 dice ถ้าทีม <2 คน', chance: '20%' },
    { name: 'นักเจรจา', desc: 'ทอยแพ้ ไม่โดนโจมตี', chance: '10%' },
    { name: 'ผู้ใช้อาวุธระยะไกล', desc: '+10% crit ถ้าแต้มนำ >3', chance: '100%' }
];

let allVillagers = []; 
let allPerks = new Set();
let allMaps = new Set(); 

const fileInput = document.getElementById('fileInput');
const perkCheckboxContainer = document.getElementById('perkCheckboxContainer');
const filterButton = document.getElementById('filterButton');
const resetButton = document.getElementById('resetButton');
const villagerListDiv = document.getElementById('villagerList');
const villagerCountSpan = document.getElementById('villagerCount');
const filterHelpText = document.getElementById('filterHelpText');
const perkDictionaryDiv = document.getElementById('perkDictionary');
const loadLatestButton = document.getElementById('loadLatestButton');

const mapCheckboxContainer = document.getElementById('mapCheckboxContainer');
const mapHelpText = document.querySelector('#mapCheckboxContainer').previousElementSibling; 

displayPerkDictionary();

function processLoadedData(villagersArray) {
    try {
        allVillagers = villagersArray; 

        if (!Array.isArray(allVillagers)) {
            throw new Error('ไฟล์ข้อมูลไม่ได้อยู่ในรูปแบบที่ถูกต้อง (Array)');
        }

        alert('โหลดไฟล์สำเร็จ! มีชาวบ้าน ' + allVillagers.length + ' คน');

        perkCheckboxContainer.innerHTML = ''; 
        filterButton.disabled = false;
        resetButton.disabled = false;
        filterHelpText.style.display = 'none';

        mapCheckboxContainer.innerHTML = ''; 
        mapHelpText.style.display = 'none';

        populatePerkFilter(); 
        populateMapFilter(); // [เพิ่ม] เรียกใช้ฟังก์ชันสร้างตัวกรอง Map
        displayVillagers(allVillagers); 
    } catch (error) {
        alert('ไฟล์ JSON ไม่ถูกต้อง หรือมีปัญหา: ' + error.message);
    }
}

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            const jsonData = JSON.parse(content);
            processLoadedData(jsonData);
        } catch (error) {
            alert('ไฟล์ JSON ไม่ถูกต้อง: ' + error.message);
        }
    };
    reader.readAsText(file);
});

loadLatestButton.addEventListener('click', () => {
    alert('กำลังโหลดข้อมูลล่าสุดจากเซิร์ฟเวอร์...');

    fetch('data.json') 
        .then(response => {
            if (!response.ok) {
                throw new Error('ไม่พบไฟล์ data.json บนเซิร์ฟเวอร์ (HTTP ' + response.status + ')');
            }
            return response.json(); 
        })
        .then(jsonData => {
            processLoadedData(jsonData);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
});

function populatePerkFilter() {
    allPerks.clear();
    perkCheckboxContainer.innerHTML = ''; 

    allVillagers.forEach(villager => {
        if(villager.perks) { 
            villager.perks.forEach(perk => {
                allPerks.add(perk);
            });
        }
    });

    allPerks.forEach(perk => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = perk;
        checkbox.className = 'perk-checkbox';
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + perk));
        perkCheckboxContainer.appendChild(label);
    });
}

function populateMapFilter() {
    allMaps.clear();
    mapCheckboxContainer.innerHTML = ''; 

    allVillagers.forEach(villager => {
        if(villager.locations) { // เช็คว่ามี locations ไหม
            villager.locations.forEach(map => {
                allMaps.add(map);
            });
        }
    });

    allMaps.forEach(map => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = map;
        checkbox.className = 'map-checkbox'; // ตั้ง class ใหม่
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + map));
        mapCheckboxContainer.appendChild(label);
    });
}

filterButton.addEventListener('click', () => {
    const checkedPerks = document.querySelectorAll('.perk-checkbox:checked');
    const selectedPerks = Array.from(checkedPerks).map(cb => cb.value);
    const checkedMaps = document.querySelectorAll('.map-checkbox:checked');
    const selectedMaps = Array.from(checkedMaps).map(cb => cb.value);

    let filteredVillagers = allVillagers; 

    if (selectedPerks.length > 0) {
        filteredVillagers = filteredVillagers.filter(villager => {
            if (!villager.perks) return false; // กัน Error
            // .every() คือต้อง "มีครบทุกอย่าง" ที่ติ๊ก
            return selectedPerks.every(perk => villager.perks.includes(perk));
        });
    }

    if (selectedMaps.length > 0) {
        filteredVillagers = filteredVillagers.filter(villager => {
            if (!villager.locations) return false; // กัน Error
            // .every() คือต้อง "ไปได้ทุกที่" ที่ติ๊ก
            return selectedMaps.every(map => villager.locations.includes(map));
        });
    }

    displayVillagers(filteredVillagers);
});

resetButton.addEventListener('click', () => {
    const checkedPerks = document.querySelectorAll('.perk-checkbox:checked');
    checkedPerks.forEach(cb => cb.checked = false);
    const checkedMaps = document.querySelectorAll('.map-checkbox:checked');
    checkedMaps.forEach(cb => cb.checked = false);
    displayVillagers(allVillagers);
});

function displayVillagers(villagers) {
    villagerListDiv.innerHTML = ''; 
    villagerCountSpan.textContent = villagers.length;

    if (villagers.length === 0) {
        villagerListDiv.innerHTML = '<p>ไม่พบชาวบ้านที่ตรงเงื่อนไข</p>';
        return;
    }

    villagers.forEach(villager => {
        const card = document.createElement('div');
        card.className = 'villager-card';

        const perksList = villager.perks ? villager.perks.map(p => `<li>${p}</li>`).join('') : '<li>ไม่มี</li>';
        const locationsList = villager.locations ? villager.locations.map(l => `<li>${l}</li>`).join('') : '<li>ไม่มี</li>';
        const winsList = villager.winsAgainst ? villager.winsAgainst.map(w => `<li>${w}</li>`).join('') : '<li>ไม่มี</li>';
        const losesList = villager.losesTo ? villager.losesTo.map(l => `<li>${l}</li>`).join('') : '<li>ไม่มี</li>';

        card.innerHTML = `
            <h3>${villager.name || 'N/A'}</h3>
            <p><strong>อาวุธ:</strong> ${villager.weapon || 'N/A'}</p>

            <strong>Perks:</strong>
            <ul>${perksList}</ul>

            <strong>สถานที่ที่ไปได้:</strong>
            <ul>${locationsList}</ul>

            <strong class="wins">ชนะทาง:</strong>
            <ul class="wins">${winsList}</ul>

            <strong class="loses">แพ้ทาง:</strong>
            <ul class="loses">${losesList}</ul>
        `;

        villagerListDiv.appendChild(card);
    });
}

function displayPerkDictionary() {
    let tableHTML = '<table class="perk-table">';
    tableHTML += '<tr><th>ชื่อ Perk</th><th>คำอธิบาย</th><th>โอกาส</th></tr>';
    perkDatabase.forEach(perk => {
        tableHTML += `
            <tr>
                <td>${perk.name}</td>
                <td>${perk.desc}</td>
                <td>${perk.chance}</td>
            </tr>
        `;
    });
    tableHTML += '</table>';
    perkDictionaryDiv.innerHTML = tableHTML;
}
