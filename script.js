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

const fileInput = document.getElementById('fileInput');
const perkCheckboxContainer = document.getElementById('perkCheckboxContainer');
const filterButton = document.getElementById('filterButton');
const resetButton = document.getElementById('resetButton');
const villagerListDiv = document.getElementById('villagerList');
const villagerCountSpan = document.getElementById('villagerCount');
const filterHelpText = document.getElementById('filterHelpText');
const perkDictionaryDiv = document.getElementById('perkDictionary');

displayPerkDictionary();

fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return; 

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            allVillagers = JSON.parse(content); 
            
            alert('โหลดไฟล์สำเร็จ! มีชาวบ้าน ' + allVillagers.length + ' คน');
            
            filterButton.disabled = false;
            resetButton.disabled = false;
            filterHelpText.style.display = 'none';

            populatePerkFilter();
            displayVillagers(allVillagers);
        } catch (error) {
            alert('ไฟล์ JSON ไม่ถูกต้อง: ' + error.message);
        }
    };
    reader.readAsText(file);
});

function populatePerkFilter() {
    allPerks.clear();
    perkCheckboxContainer.innerHTML = '';

    allVillagers.forEach(villager => {
        villager.perks.forEach(perk => {
            allPerks.add(perk);
        });
    });

    allPerks.forEach(perk => {
        const label = document.createElement('label');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = perk;
        checkbox.className = 'perk-checkbox';
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + perk)); // เพิ่มข้อความ
        
        perkCheckboxContainer.appendChild(label);
    });
}

filterButton.addEventListener('click', () => {
    const checkedBoxes = document.querySelectorAll('.perk-checkbox:checked');
    const selectedPerks = Array.from(checkedBoxes).map(cb => cb.value);

    if (selectedPerks.length === 0) {
        displayVillagers(allVillagers);
        return;
    }

    const filteredVillagers = allVillagers.filter(villager => {
        return selectedPerks.every(perk => villager.perks.includes(perk));
    });

    displayVillagers(filteredVillagers);
});

resetButton.addEventListener('click', () => {
    const checkedBoxes = document.querySelectorAll('.perk-checkbox:checked');
    checkedBoxes.forEach(cb => cb.checked = false);
    
    displayVillagers(allVillagers);
});

function displayVillagers(villagers) {
    villagerListDiv.innerHTML = ''; // ล้างข้อมูลเก่า
    villagerCountSpan.textContent = villagers.length;

    if (villagers.length === 0) {
        villagerListDiv.innerHTML = '<p>ไม่พบชาวบ้านที่ตรงเงื่อนไข</p>';
        return;
    }

    villagers.forEach(villager => {
        const card = document.createElement('div');
        card.className = 'villager-card';
        const perksList = villager.perks.map(p => `<li>${p}</li>`).join('');
        const locationsList = villager.locations.map(l => `<li>${l}</li>`).join('');
        const winsList = villager.winsAgainst.map(w => `<li>${w}</li>`).join('');
        const losesList = villager.losesTo.map(l => `<li>${l}</li>`).join('');

        card.innerHTML = `
            <h3>${villager.name}</h3>
            <p><strong>อาวุธ:</strong> ${villager.weapon}</p>
            
            <strong>Perks:</strong>
            <ul>${perksList || '<li>ไม่มี</li>'}</ul>
            
            <strong>สถานที่ที่ไปได้:</strong>
            <ul>${locationsList || '<li>ไม่มี</li>'}</ul>
            
            <strong class="wins">ชนะทาง:</strong>
            <ul class="wins">${winsList || '<li>ไม่มี</li>'}</ul>
            
            <strong class="loses">แพ้ทาง:</strong>
            <ul class="loses">${losesList || '<li>ไม่มี</li>'}</ul>
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
