const STORAGE_KEY = 'savedVillagers';

let currentVillagersList = [];

const textInput = document.getElementById('textInput');
const addVillagerButton = document.getElementById('addVillagerButton');
const exportButton = document.getElementById('exportButton');
const villagerPreviewList = document.getElementById('villagerPreviewList');
const villagerCountSpan = document.getElementById('villagerCount');

const saveToLocalButton = document.getElementById('saveToLocalButton');
const clearAllButton = document.getElementById('clearAllButton');


window.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    
    addVillagerButton.addEventListener('click', handleAddVillager);
    exportButton.addEventListener('click', handleExport);
    saveToLocalButton.addEventListener('click', () => {
        saveToLocalStorage();
        alert('บันทึกข้อมูลลงบราวเซอร์เรียบร้อย!');
    });
    clearAllButton.addEventListener('click', handleClearAll);
    
    villagerPreviewList.addEventListener('click', handleCardClick);
});


function handleAddVillager() {
    const text = textInput.value;
    if (text.trim().length === 0) {
        alert('กรุณาวางข้อมูลก่อน');
        return;
    }

    try {
        const newVillager = parseVillagerText(text);
        newVillager._rawText = text; 
        currentVillagersList.unshift(newVillager); // .unshift() คือเพิ่มด้านหน้า (ใหม่สุด)
        
        displayPreview();
        saveToLocalStorage();
        
        textInput.value = ''; 
    } catch (error) {
        alert('เกิดข้อผิดพลาดในการแปลงข้อมูล: ' + error.message);
        console.error(error);
    }
}

function handleExport() {
    if (currentVillagersList.length === 0) {
        alert('ยังไม่มีข้อมูลชาวบ้านให้ Export');
        return;
    }
    // สร้างสำเนาของ List ก่อน Export
    const exportList = [...currentVillagersList];

    exportList.reverse(); 

    const jsonString = JSON.stringify(exportList, (key, value) => {
        if (key === '_rawText') { // ไม่ Export ข้อความดิบ
            return undefined;
        }
        return value;
    }, 2);
    
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function displayPreview() {
    villagerPreviewList.innerHTML = ''; 
    villagerCountSpan.textContent = currentVillagersList.length;

    const allCardsHTML = currentVillagersList.map((villager, index) => {
        return `<div class="villager-card">${createCardHTML(villager, index)}</div>`;
    }).join('');
    
    villagerPreviewList.innerHTML = allCardsHTML;
}

function createCardHTML(villager, index) {
    const formatObjectToList = (obj) => {
        if (!obj) return '<li>ไม่มี</li>';
        return Object.entries(obj).map(([key, val]) => `<li>${key}: ${val}</li>`).join('');
    };
    const formatArrayToList = (arr) => {
        if (!arr || arr.length === 0) return '<li>ไม่มี</li>';
        return arr.map(item => `<li>${item}</li>`).join('');
    };

    let cardHTML = `
        <h3>${villager.name}</h3>
        <p><strong>อาวุธ:</strong> ${villager.weapon}</p>
        <strong>ค่าสถานะ:</strong>
        <ul>${formatObjectToList(villager.stats)}</ul>
        <strong>ค่าจ้าง:</strong>
        <ul>${formatObjectToList(villager.cost)}</ul>
        <strong>ลูกเต๋า:</strong>
        <ul>${formatObjectToList(villager.dice)}</ul>
        <strong>Perks:</strong>
        <ul>${formatArrayToList(villager.perks)}</ul>
        <strong>สถานที่:</strong>
        <ul>${formatArrayToList(villager.locations)}</ul>
        <strong class="wins">ชนะทาง:</strong>
        <ul class="wins">${formatArrayToList(villager.winsAgainst)}</ul>
        <strong class="loses">แพ้ทาง:</strong>
        <ul class="loses">${formatArrayToList(villager.losesTo)}</ul>
    `;

    cardHTML += `
        <div class="card-controls">
            <button class="edit-btn" data-index="${index}">แก้ไข</button>
            <button class="delete-btn" data-index="${index}">ลบ</button>
        </div>
    `;

    return cardHTML;
}

function parseVillagerText(text) {
    const lines = text.trim().split('\n');
    const villager = {
        name: lines[0].trim(), cost: {}, stats: {}, dice: {},
        weapon: "", winsAgainst: [], losesTo: [], locations: [], perks: []
    };
    let currentSection = "";
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        if (line.startsWith('ค่าใช้จ่ายในการจ้าง')) { currentSection = 'cost'; continue; }
        if (line.startsWith('ค่าสถานะ')) { currentSection = 'stats'; continue; }
        if (line.startsWith('จำนวนลูกเต๋า')) { currentSection = 'dice'; continue; }
        if (line.startsWith('อาวุธที่ชนะทาง')) { currentSection = 'wins'; continue; }
        if (line.startsWith('อาวุธที่แพ้ทาง')) { currentSection = 'loses'; continue; }
        if (line === 'อาวุธ') { currentSection = 'weapon'; continue; } 
        if (line.startsWith('สถานที่ที่สามารถส่งไปได้')) { currentSection = 'locations'; continue; }
        if (line.startsWith('Perks')) { currentSection = 'perks'; continue; }
        if (line.startsWith('ข้อมูล') || line.startsWith('สถานที่พบเจอ') || line.startsWith('อาวุธที่แพ้–ชนะ')) {
            currentSection = 'ignore'; continue; 
        }
        switch (currentSection) {
            case 'cost':
                const [costKey, costVal] = line.split(':');
                if (costKey.includes('เงิน')) villager.cost.money = parseInt(costVal.trim());
                if (costKey.includes('ทอง')) villager.cost.gold = parseInt(costVal.trim());
                if (costKey.includes('เพชร')) villager.cost.diamond = parseInt(costVal.trim());
                break;
            case 'stats':
                const [statKey, statVal] = line.split(':');
                villager.stats[statKey.trim()] = parseInt(statVal.trim());
                break;
            case 'dice':
                const [diceKey, diceVal] = line.split(':');
                if (diceKey.includes('ฝ่ายบุก')) villager.dice.attack = parseInt(diceVal.trim());
                if (diceKey.includes('ฝ่ายตั้งรับ')) villager.dice.defense = parseInt(diceVal.trim());
                break;
            case 'weapon':
                villager.weapon = line; break;
            case 'wins':
                villager.winsAgainst.push(line); break;
            case 'loses':
                villager.losesTo.push(line); break;
            case 'locations':
                villager.locations.push(line); break;
            case 'perks':
                const perkName = line.split(' - ')[0].trim();
                villager.perks.push(perkName); break;
        }
    }
    return villager;
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentVillagersList));
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        console.log('พบข้อมูลที่เซฟไว้, กำลังโหลด...');
        currentVillagersList = JSON.parse(savedData);
        displayPreview(); // โหลดเสร็จแล้ว อัปเดตหน้าจอ
    }
}

function handleCardClick(event) {
    const target = event.target;
    const index = target.dataset.index; 
    if (index === undefined) { return; }

    if (target.classList.contains('delete-btn')) {
        const villagerName = currentVillagersList[index].name;
        if (confirm(`คุณต้องการลบ "${villagerName}" จริงหรือ?`)) {
            currentVillagersList.splice(index, 1); 
            displayPreview(); 
            saveToLocalStorage(); 
        }
    }

    if (target.classList.contains('edit-btn')) {
        const villagerToEdit = currentVillagersList[index];
        textInput.value = villagerToEdit._rawText;
        currentVillagersList.splice(index, 1); 
        alert(`ข้อมูลของ "${villagerToEdit.name}" ถูกโหลดกลับไปที่ช่องกรอกแล้ว\n\n(ข้อมูลเดิมถูกลบแล้ว กรุณากดยืนยันอีกครั้งหลังแก้ไขเสร็จ)`);
        displayPreview();
        saveToLocalStorage();
        window.scrollTo(0, 0);
    }
}

function handleClearAll() {
    if (confirm('!!! ยืนยันการล้างข้อมูล !!!\n\nคุณแน่ใจนะ? ข้อมูลชาวบ้านทั้งหมดที่เซฟไว้ในบราวเซอร์จะหายไปถาวร')) {
        currentVillagersList = []; 
        localStorage.removeItem(STORAGE_KEY); 
        displayPreview(); 
        alert('ล้างข้อมูลทั้งหมดเรียบร้อย');
    }
}