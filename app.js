// ============================================
// PLANEJADOR ALIMENTAR - APLICAÇÃO PRINCIPAL
// ============================================

// Funções utilitárias (definidas primeiro para uso em appData)
function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now - startOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

function formatCurrency(value) {
    // Verificar se appData já foi inicializado
    const currency = (typeof appData !== 'undefined' && appData?.settings?.currency) ? appData.settings.currency : 'EUR';
    if (currency === 'EUR') {
        return `€ ${value.toFixed(2)}`;
    }
    return `R$ ${value.toFixed(2)}`;
}

// Dados da aplicação
const appData = {
    peopleCount: 2,
    weeklyBudget: 250,
    monthlyBudget: 1000,
    currentWeek: getCurrentWeek(),
    mealPlan: {},
    shoppingList: [],
    expenses: [],
    recipes: [],
    inventory: [], // Inventário da casa
    promotions: [], // Promoções carregadas
    preferences: {
        vegetarian: false,
        lowCarb: false,
        lactoseFree: false,
        economy: true
    },
    settings: {
        userName: "Família de 2 Pessoas",
        unitPreference: "g",
        currency: "EUR", // Euro como padrão
        notifications: {
            shopping: true,
            promotions: true,
            recipes: false
        }
    }
};

// Variáveis globais
let categoryChart = null;
let trendChart = null;
let videoStream = null;
let currentRecipeSearch = '';
let editingMealIndex = null;
let editingMealDay = null;

// API Configuration
const MEAL_DB_API = 'https://www.themealdb.com/api/json/v1/1';
const SPOONACULAR_API_KEY = '26b945a353764564900d4a76546373af';
const SPOONACULAR_API = 'https://api.spoonacular.com';
const TRANSLATE_API = 'https://api.mymemory.translated.net/get';
const CORS_PROXY = 'https://api.allorigins.win/raw?url='; // Proxy público para contornar CORS

const SUPERMARKETS = {
    CONTINENTE: {
        name: 'Continente',
        searchUrl: 'https://www.continente.pt/pt/pesquisa/?q=',
        jsonSuffix: '&format=json'
    },
    AUCHAN: {
        name: 'Auchan',
        searchUrl: 'https://www.auchan.pt/pt/pesquisa?q='
    }
};

// Dicionário de tradução comum para termos de comida
const foodTranslationDict = {
    'frango': 'chicken',
    'carne': 'beef',
    'peixe': 'fish',
    'porco': 'pork',
    'arroz': 'rice',
    'feijão': 'beans',
    'batata': 'potato',
    'tomate': 'tomato',
    'cebola': 'onion',
    'alho': 'garlic',
    'pão': 'bread',
    'queijo': 'cheese',
    'leite': 'milk',
    'ovo': 'egg',
    'ovos': 'eggs',
    'salada': 'salad',
    'sopa': 'soup',
    'macarrão': 'pasta',
    'massa': 'pasta',
    'pizza': 'pizza',
    'bolo': 'cake',
    'sobremesa': 'dessert',
    'vegetariano': 'vegetarian',
    'vegano': 'vegan',
    'doce': 'sweet',
    'salgado': 'savory',
    'picante': 'spicy',
    'doce': 'sweet'
};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadDataFromStorage();
    setupEventListeners();
    updateUI();
    updateCurrentWeek();
    updateInventory();
    loadPromotions().then(() => {
        displayPromotions();
    });
});

// ============================================
// LOCALSTORAGE - PERSISTÊNCIA DE DADOS
// ============================================

function saveDataToStorage() {
    try {
        localStorage.setItem('planejadorAlimentar', JSON.stringify(appData));
        // Não mostrar toast a cada salvamento automático
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showToast('Erro ao salvar dados', 'error');
    }
}

function saveDataToStorageWithToast() {
    try {
        localStorage.setItem('planejadorAlimentar', JSON.stringify(appData));
        showToast('Dados salvos com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showToast('Erro ao salvar dados', 'error');
    }
}

function loadDataFromStorage() {
    try {
        const saved = localStorage.getItem('planejadorAlimentar');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(appData, parsed);
        } else {
            loadSampleData();
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        loadSampleData();
    }
}

function clearAllData() {
    if (confirm("Tem certeza que deseja excluir TODOS os dados? Esta ação não pode ser desfeita.")) {
        localStorage.removeItem('planejadorAlimentar');
        location.reload();
    }
}

// ============================================
// DADOS DE EXEMPLO
// ============================================

function loadSampleData() {
    if (appData.mealPlan && Object.keys(appData.mealPlan).length > 0) {
        return; // Já tem dados
    }

    appData.mealPlan = {
        monday: [
            { time: "Café", meal: "Pão integral com ovos e suco" },
            { time: "Almoço", meal: "Frango grelhado com arroz e salada" },
            { time: "Jantar", meal: "Sopa de legumes" }
        ],
        tuesday: [
            { time: "Café", meal: "Iogurte com granola e frutas" },
            { time: "Almoço", meal: "Peixe assado com purê e brócolis" },
            { time: "Jantar", meal: "Sanduíche natural" }
        ],
        wednesday: [
            { time: "Café", meal: "Aveia com banana e mel" },
            { time: "Almoço", meal: "Lasanha de berinjela" },
            { time: "Jantar", meal: "Omelete com salada" }
        ],
        thursday: [
            { time: "Café", meal: "Vitamina de frutas com pão" },
            { time: "Almoço", meal: "Feijoada light" },
            { time: "Jantar", meal: "Torta de legumes" }
        ],
        friday: [
            { time: "Café", meal: "Pão de queijo com café" },
            { time: "Almoço", meal: "Macarrão ao molho pesto" },
            { time: "Jantar", meal: "Pizza caseira" }
        ],
        saturday: [
            { time: "Café", meal: "Panquecas americanas" },
            { time: "Almoço", meal: "Churrasco em família" },
            { time: "Jantar", meal: "Restaurante (especial)" }
        ],
        sunday: [
            { time: "Café", meal: "Bolo caseiro com café" },
            { time: "Almoço", meal: "Frango assado com batatas" },
            { time: "Jantar", meal: "Sobras do almoço" }
        ]
    };

    if (appData.shoppingList.length === 0) {
        appData.shoppingList = [
            { id: 1, name: "Arroz", quantity: 2, unit: "kg", category: "Mercado", price: 12.00, checked: false },
            { id: 2, name: "Feijão", quantity: 1, unit: "kg", category: "Mercado", price: 8.50, checked: false },
            { id: 3, name: "Macarrão", quantity: 2, unit: "pacotes", category: "Mercado", price: 6.00, checked: false },
            { id: 4, name: "Frango", quantity: 2, unit: "kg", category: "Açougue", price: 30.00, checked: false },
            { id: 5, name: "Peixe", quantity: 1, unit: "kg", category: "Açougue", price: 25.00, checked: false },
            { id: 6, name: "Tomate", quantity: 1.5, unit: "kg", category: "Hortifruti", price: 9.00, checked: false },
            { id: 7, name: "Alface", quantity: 2, unit: "un", category: "Hortifruti", price: 4.00, checked: false },
            { id: 8, name: "Cenoura", quantity: 1, unit: "kg", category: "Hortifruti", price: 3.50, checked: false },
            { id: 9, name: "Leite", quantity: 4, unit: "L", category: "Laticínios", price: 16.00, checked: false },
            { id: 10, name: "Ovos", quantity: 12, unit: "un", category: "Mercado", price: 12.00, checked: false }
        ];
    }

    if (appData.expenses.length === 0) {
        const today = new Date();
        appData.expenses = [
            { id: 1, date: formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)), store: "Supermercado X", amount: 187.50, items: 15 },
            { id: 2, date: formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), store: "Hortifruti Y", amount: 65.30, items: 8 },
            { id: 3, date: formatDate(new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000)), store: "Açougue Z", amount: 89.90, items: 5 }
        ];
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('data-target');
            navigateToSection(target);
        });
    });

    // Contador de pessoas
    document.getElementById('increase-people').addEventListener('click', () => {
        if (appData.peopleCount < 10) {
            appData.peopleCount++;
            updatePeopleCount();
            updateShoppingListForPeople();
            saveDataToStorage();
        }
    });

    document.getElementById('decrease-people').addEventListener('click', () => {
        if (appData.peopleCount > 1) {
            appData.peopleCount--;
            updatePeopleCount();
            updateShoppingListForPeople();
            saveDataToStorage();
        }
    });

    // Botão ajustar para pessoas
    document.getElementById('adjust-for-people').addEventListener('click', () => {
        const newCount = prompt("Para quantas pessoas deseja ajustar?", appData.peopleCount);
        if (newCount && !isNaN(newCount) && newCount >= 1 && newCount <= 10) {
            appData.peopleCount = parseInt(newCount);
            updatePeopleCount();
            updateShoppingListForPeople();
            saveDataToStorage();
        }
    });

    // Botões de ação rápida
    document.getElementById('generate-meal-plan').addEventListener('click', async () => {
        await generateMealPlan();
    });
    document.getElementById('generate-shopping-list').addEventListener('click', async () => {
        await generateShoppingList();
    });
    document.getElementById('export-data').addEventListener('click', exportData);

    // Modal da câmera
    document.getElementById('open-camera').addEventListener('click', () => {
        document.getElementById('camera-modal').classList.add('active');
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllModals();
        });
    });

    document.getElementById('cancel-scan').addEventListener('click', () => {
        stopCamera();
        closeAllModals();
    });

    // Câmera
    document.getElementById('start-camera').addEventListener('click', startCamera);
    document.getElementById('capture-photo').addEventListener('click', capturePhoto);

    // Simular escaneamento
    document.getElementById('simulate-scan').addEventListener('click', simulateReceiptScan);

    // Adicionar item manualmente
    document.getElementById('add-manual-item').addEventListener('click', () => {
        document.getElementById('item-modal').classList.add('active');
    });

    document.getElementById('save-item').addEventListener('click', addManualItem);
    document.getElementById('cancel-item').addEventListener('click', () => {
        document.getElementById('item-modal').classList.remove('active');
    });

    // Limpar lista
    document.getElementById('clear-list').addEventListener('click', () => {
        if (confirm("Tem certeza que deseja limpar toda a lista de compras?")) {
            appData.shoppingList = [];
            updateShoppingList();
            saveDataToStorage();
        }
    });

    // Adicionar despesa
    document.getElementById('add-expense').addEventListener('click', addExpense);
    
    // Inventário
    document.getElementById('add-inventory-item')?.addEventListener('click', () => {
        const name = prompt("Nome do item:");
        if (!name) return;
        
        const quantity = prompt("Quantidade:", "1");
        if (!quantity || isNaN(quantity)) return;
        
        const unit = prompt("Unidade (kg, g, L, ml, un):", "un");
        if (!unit) return;
        
        const category = prompt("Categoria:", "Mercado");
        
        const newId = appData.inventory.length > 0 
            ? Math.max(...appData.inventory.map(i => i.id)) + 1 
            : 1;
        
        appData.inventory.push({
            id: newId,
            name: name,
            quantity: parseFloat(quantity),
            unit: unit,
            category: category || "Mercado",
            addedDate: new Date().toISOString()
        });
        
        updateInventory();
        saveDataToStorage();
        showToast('Item adicionado ao inventário!', 'success');
    });
    
    document.getElementById('refresh-inventory')?.addEventListener('click', () => {
        updateInventory();
        showToast('Inventário atualizado!', 'success');
    });
    
    // Carregar promoções
    document.getElementById('load-promotions')?.addEventListener('click', () => {
        loadPromotions();
    });
    
    document.getElementById('refresh-promotions')?.addEventListener('click', () => {
        loadPromotions();
    });
    
    // Edição de cardápio
    document.getElementById('edit-meal-plan')?.addEventListener('click', () => {
        showToast('Clique em "Editar" ao lado de cada refeição para modificá-la', 'success');
    });
    
    document.getElementById('new-meal-plan')?.addEventListener('click', async () => {
        if (confirm("Deseja criar um novo cardápio? O cardápio atual será substituído.")) {
            await generateMealPlan();
        }
    });

    // Receitas
    document.getElementById('search-recipes').addEventListener('click', () => {
        searchRecipesOnline();
    });
    document.getElementById('apply-filters').addEventListener('click', () => {
        searchRecipesOnline();
    });
    document.getElementById('recipe-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchRecipesOnline();
        }
    });

    // Configurações
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('reset-settings').addEventListener('click', resetSettings);
    document.getElementById('clear-all-data').addEventListener('click', clearAllData);

    // Orçamento semanal
    document.getElementById('weekly-budget').addEventListener('change', (e) => {
        appData.weeklyBudget = parseFloat(e.target.value) || 250;
        saveDataToStorage();
        updateDashboard();
    });

    // Upload de nota fiscal para OCR
    document.getElementById('receipt-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        showToast('Processando imagem com OCR...', 'success');
        try {
            const result = await Tesseract.recognize(file, 'por');
            const text = result.data.text;
            if (text && text.trim()) {
                processReceiptText(text);
                showToast('OCR concluído!', 'success');
            } else {
                showToast('Não foi possível ler a imagem.', 'error');
            }
        } catch (error) {
            console.error('Erro no OCR:', error);
            showToast('Erro ao processar imagem.', 'error');
        }
    });

    // Imprimir lista
    document.getElementById('print-list').addEventListener('click', printShoppingList);
    
    // Otimizar preços
    document.getElementById('optimize-prices')?.addEventListener('click', optimizeShoppingListPrices);
}

// ============================================
// OTIMIZAÇÃO INTELIGENTE DE PREÇOS
// ============================================

function optimizeShoppingListPrices() {
    let totalSavings = 0;
    let optimizedCount = 0;
    
    appData.shoppingList.forEach(item => {
        const bestPrice = findBestPrice(item.name);
        if (bestPrice) {
            // Calcular preço otimizado baseado na quantidade
            const pricePerUnit = bestPrice.price / bestPrice.data.quantity;
            const optimizedPrice = pricePerUnit * item.quantity;
            
            if (optimizedPrice < item.price) {
                const savings = item.price - optimizedPrice;
                totalSavings += savings;
                item.price = optimizedPrice;
                item.suggestedStore = bestPrice.store;
                item.originalPrice = item.price + savings; // Guardar preço original
                optimizedCount++;
            }
        }
    });
    
    if (optimizedCount > 0) {
        updateShoppingList();
        saveDataToStorage();
        showToast(`Preços otimizados! ${optimizedCount} itens atualizados. Economia: ${formatCurrency(totalSavings)}`, 'success');
    } else {
        showToast('Todos os preços já estão otimizados!', 'success');
    }
}

function updateShoppingTotal() {
    let total = 0;
    let checkedTotal = 0;
    let possibleSavings = 0;
    
    appData.shoppingList.forEach(item => {
        total += item.price;
        if (item.checked) {
            checkedTotal += item.price;
        }
        
        // Calcular economia possível
        const bestPrice = findBestPrice(item.name);
        if (bestPrice) {
            const pricePerUnit = bestPrice.price / bestPrice.data.quantity;
            const bestPriceForQuantity = pricePerUnit * item.quantity;
            if (bestPriceForQuantity < item.price) {
                possibleSavings += (item.price - bestPriceForQuantity);
            }
        }
    });
    
    const shoppingTotal = document.getElementById('shopping-total');
    if (shoppingTotal) {
        shoppingTotal.textContent = formatCurrency(total);
    }
    
    // Atualizar informação de economia
    const savingsInfo = document.getElementById('savings-info');
    const possibleSavingsEl = document.getElementById('possible-savings');
    if (savingsInfo && possibleSavingsEl) {
        if (possibleSavings > 0) {
            savingsInfo.style.display = 'block';
            possibleSavingsEl.textContent = formatCurrency(possibleSavings);
        } else {
            savingsInfo.style.display = 'none';
        }
    }
    
    // Atualizar estatísticas
    const remaining = total - checkedTotal;
    const statBudget = document.getElementById('stat-budget');
    if (statBudget) {
        statBudget.textContent = formatCurrency(remaining);
    }
}

// ============================================
// NAVEGAÇÃO
// ============================================

function navigateToSection(target) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-target="${target}"]`).classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(target).classList.add('active');

    // Atualizar gráficos quando abrir seção de despesas
    if (target === 'expenses') {
        setTimeout(() => {
            updateCharts();
        }, 100);
    }
    
    // Atualizar inventário quando abrir seção
    if (target === 'inventory') {
        updateInventory();
    }
    
    // Atualizar promoções quando abrir seção de compras
    if (target === 'shopping') {
        displayPromotions();
    }
}

// ============================================
// ATUALIZAÇÃO DA INTERFACE
// ============================================

function updateUI() {
    updatePeopleCount();
    updateMealPlan();
    updateShoppingList();
    updateExpenses();
    updateRecipes();
    updateDashboard();
    updateSettingsUI();
}

function updatePeopleCount() {
    document.getElementById('people-count').textContent = appData.peopleCount;
    document.getElementById('meal-people-count').textContent = appData.peopleCount;
    document.querySelector('.user-avatar').textContent = appData.peopleCount + 'P';
    document.querySelector('.user-info h3').textContent = 'Para ' + appData.peopleCount + ' Pessoa' + (appData.peopleCount > 1 ? 's' : '');
}

function updateCurrentWeek() {
    const week = getCurrentWeek();
    const year = new Date().getFullYear();
    document.getElementById('current-week').textContent = `Semana ${week}/${year}`;
}

function updateMealPlan() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    // Dashboard preview
    const mealPlanGrid = document.getElementById('dashboard-meal-plan');
    if (mealPlanGrid) {
        mealPlanGrid.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const day = days[i];
            if (appData.mealPlan[day]) {
                const dayCard = createDayCard(day, dayNames[i]);
                mealPlanGrid.appendChild(dayCard);
            }
        }
    }
    
    // Cardápio completo
    const fullMealPlan = document.getElementById('full-meal-plan');
    if (fullMealPlan) {
        fullMealPlan.innerHTML = '';
        
        days.forEach((day, index) => {
            if (appData.mealPlan[day]) {
                const dayCard = createDayCard(day, dayNames[index]);
                fullMealPlan.appendChild(dayCard);
            }
        });
    }
}

function createDayCard(day, dayName) {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    
    let mealsHTML = '';
    appData.mealPlan[day].forEach((meal, index) => {
        mealsHTML += `
            <div class="meal-item">
                <span class="meal-time">${meal.time}:</span>
                <span class="meal-name">${meal.meal}</span>
                <div class="item-actions" style="margin-left: 10px;">
                    <button onclick="editMeal('${day}', ${index})" style="background: none; border: none; color: var(--primary-color); cursor: pointer; padding: 5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteMeal('${day}', ${index})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; padding: 5px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    dayCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h4>${dayName} <small>${appData.peopleCount}p</small></h4>
            <button onclick="addMealToDay('${day}')" class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;">
                <i class="fas fa-plus"></i> Adicionar
            </button>
        </div>
        ${mealsHTML}
    `;
    
    return dayCard;
}

function updateShoppingList() {
    // Dashboard preview
    const shoppingList = document.getElementById('dashboard-shopping-list');
    if (shoppingList) {
        shoppingList.innerHTML = '';
        
        const previewItems = appData.shoppingList.slice(0, 5);
        previewItems.forEach(item => {
            shoppingList.appendChild(createShoppingItem(item, true));
        });
    }
    
    // Lista completa
    const fullList = document.getElementById('full-shopping-list');
    if (fullList) {
        fullList.innerHTML = '';
        
        appData.shoppingList.forEach(item => {
            fullList.appendChild(createShoppingItem(item, false));
        });
    }
    
    // Organização por loja
    updateShoppingByStore();
    
    // Atualizar total
    updateShoppingTotal();
    
    // Atualizar contador de itens no header
    const statItems = document.getElementById('stat-items');
    if (statItems) {
        statItems.textContent = appData.shoppingList.length;
    }
}

function createShoppingItem(item, isPreview) {
    const li = document.createElement('li');
    li.className = 'shopping-item' + (item.checked ? ' checked' : '');
    
    // Buscar melhor preço inteligente
    const bestPrice = findBestPrice(item.name);
    const hasBetterPrice = bestPrice && bestPrice.price < item.price;
    
    const actionsHTML = isPreview ? '' : `
        <div class="item-actions">
            <button class="compare-price" data-name="${item.name}" title="Comparar Preços em Portugal">
                <i class="fas fa-search-dollar"></i>
            </button>
            <button class="edit-item" data-id="${item.id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    li.innerHTML = `
        <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
        <div class="item-info" style="flex: 1;">
            <div class="item-name" style="display: flex; align-items: center; gap: 8px;">
                ${item.name}
                ${hasBetterPrice ? `<span style="background-color: var(--success-color); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">💡 Melhor: ${formatCurrency(bestPrice.price)} em ${bestPrice.store}</span>` : ''}
            </div>
            <div class="item-details">
                <span>${item.quantity} ${item.unit}</span>
                ${!isPreview ? `<span>Categoria: ${item.category}</span>` : ''}
                <span style="${hasBetterPrice ? 'text-decoration: line-through; color: var(--text-light);' : ''}">${formatCurrency(item.price)}</span>
                ${hasBetterPrice ? `<span style="color: var(--success-color); font-weight: 600; margin-left: 5px;">→ ${formatCurrency(bestPrice.price)}</span>` : ''}
            </div>
        </div>
        ${actionsHTML}
    `;
    
    // Event listeners
    li.querySelector('.item-checkbox').addEventListener('change', function() {
        const itemId = parseInt(this.getAttribute('data-id'));
        const item = appData.shoppingList.find(i => i.id === itemId);
        if (item) {
            item.checked = this.checked;
            
            // Se marcado como comprado, adicionar ao inventário
            if (this.checked) {
                addToInventory(item);
            }
            
            updateShoppingList();
            updateShoppingTotal();
            saveDataToStorage();
        }
    });
    
    if (!isPreview) {
        li.querySelector('.edit-item').addEventListener('click', () => {
            editShoppingItem(item.id);
        });
        
        li.querySelector('.delete-item').addEventListener('click', () => {
            deleteShoppingItem(item.id);
        });

        li.querySelector('.compare-price').addEventListener('click', () => {
            PriceTracker.comparePrices(item.name);
        });
    }
    
    return li;
}

function updateShoppingByStore() {
    const container = document.getElementById('shopping-by-store');
    if (!container) return;
    
    const categories = ['Mercado', 'Hortifruti', 'Açougue', 'Padaria', 'Laticínios', 'Limpeza', 'Outros'];
    container.innerHTML = '';
    
    categories.forEach(category => {
        const items = appData.shoppingList.filter(item => item.category === category);
        if (items.length > 0) {
            const div = document.createElement('div');
            div.innerHTML = `
                <h4 style="margin-bottom: 15px; color: var(--primary-dark);">${category}</h4>
                <ul class="shopping-list">
                    ${items.map(item => `
                        <li class="shopping-item ${item.checked ? 'checked' : ''}">
                            <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''} data-id="${item.id}">
                            <div class="item-info">
                                <div class="item-name">${item.name}</div>
                                <div class="item-details">
                                    <span>${item.quantity} ${item.unit}</span>
                                    <span>${formatCurrency(item.price)}</span>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // Adicionar event listeners aos checkboxes
            div.querySelectorAll('.item-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    const itemId = parseInt(this.getAttribute('data-id'));
                    const item = appData.shoppingList.find(i => i.id === itemId);
                    if (item) {
                        item.checked = this.checked;
                        updateShoppingList();
                        updateShoppingTotal();
                        saveDataToStorage();
                    }
                });
            });
            
            container.appendChild(div);
        }
    });
}

// updateShoppingTotal já foi definida anteriormente com lógica melhorada

function updateExpenses() {
    const expenseList = document.getElementById('expense-history');
    if (!expenseList) return;
    
    expenseList.innerHTML = '';
    
    if (appData.expenses.length === 0) {
        expenseList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">Nenhuma despesa registrada ainda.</p>';
        return;
    }
    
    appData.expenses.forEach(expense => {
        const div = document.createElement('div');
        div.className = 'expense-item';
        
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        div.innerHTML = `
            <div>
                <div style="font-weight: 600;">${expense.store}</div>
                <div class="expense-date">${formattedDate} • ${expense.items} itens</div>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
        `;
        
        expenseList.appendChild(div);
    });
    
    updateExpenseSummary();
}

function updateExpenseSummary() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekExpenses = appData.expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= weekAgo;
    });
    
    const weekTotal = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const average = appData.expenses.length > 0 
        ? appData.expenses.reduce((sum, e) => sum + e.amount, 0) / appData.expenses.length 
        : 0;
    
    const monthlySavings = (appData.weeklyBudget * 4) - (average * 4);
    const maxSavings = Math.max(...appData.expenses.map(e => e.amount), 0);
    
    document.getElementById('expense-week').textContent = formatCurrency(weekTotal);
    document.getElementById('expense-average').textContent = formatCurrency(average);
    document.getElementById('expense-monthly').textContent = formatCurrency(monthlySavings);
    document.getElementById('expense-max').textContent = formatCurrency(maxSavings);
}

function updateRecipes() {
    // Dashboard
    const recipeGrid = document.getElementById('dashboard-recipes');
    if (recipeGrid && appData.recipes.length > 0) {
        recipeGrid.innerHTML = '';
        
        const previewRecipes = appData.recipes.slice(0, 3);
        previewRecipes.forEach(recipe => {
            recipeGrid.appendChild(createRecipeCard(recipe));
        });
    }
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    const imgUrl = recipe.strMealThumb || recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
    
    card.innerHTML = `
        <div class="recipe-img" style="background-image: url('${imgUrl}');"></div>
        <div class="recipe-info">
            <div class="recipe-title">${recipe.strMeal || recipe.name}</div>
            <div class="recipe-meta">
                <span><i class="fas fa-clock"></i> ${recipe.time || 'N/A'} min</span>
                <span>${recipe.category || recipe.strCategory || 'Geral'}</span>
            </div>
            <button class="btn btn-outline" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" onclick="showRecipeDetails('${recipe.idMeal || recipe.id}', '${recipe.source || 'themealdb'}')">
                <i class="fas fa-eye"></i> Ver Detalhes
            </button>
        </div>
    `;
    
    return card;
}

function updateDashboard() {
    const totalWeekly = appData.shoppingList.reduce((sum, item) => sum + item.price, 0);
    const budget = appData.weeklyBudget;
    const savings = budget - totalWeekly;
    
    const statSavings = document.getElementById('stat-savings');
    if (statSavings) {
        statSavings.textContent = savings > 0 ? formatCurrency(savings) : formatCurrency(0);
    }
    
    const statBudget = document.getElementById('stat-budget');
    if (statBudget) {
        statBudget.textContent = formatCurrency(budget);
    }
    
    // Contar refeições planejadas
    let mealCount = 0;
    Object.values(appData.mealPlan).forEach(day => {
        if (Array.isArray(day)) {
            mealCount += day.length;
        }
    });
    
    const statMeals = document.getElementById('stat-meals');
    if (statMeals) {
        statMeals.textContent = mealCount;
    }
}

function updateSettingsUI() {
    document.getElementById('user-name').value = appData.settings.userName;
    document.getElementById('monthly-budget').value = appData.monthlyBudget;
    document.getElementById('settings-people').value = appData.peopleCount;
    document.getElementById('unit-preference').value = appData.settings.unitPreference;
    document.getElementById('notif-shopping').checked = appData.settings.notifications.shopping;
    document.getElementById('notif-promotions').checked = appData.settings.notifications.promotions;
    document.getElementById('notif-recipes').checked = appData.settings.notifications.recipes;
}

// ============================================
// FUNÇÕES DE CARDÁPIO
// ============================================

async function fetchRandomRecipeByCategory(category) {
    try {
        const response = await fetch(`${MEAL_DB_API}/filter.php?c=${category}`);
        const data = await response.json();
        if (data.meals && data.meals.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.meals.length);
            const mealId = data.meals[randomIndex].idMeal;
            
            // Buscar detalhes da receita
            const detailResponse = await fetch(`${MEAL_DB_API}/lookup.php?i=${mealId}`);
            const detailData = await detailResponse.json();
            return detailData.meals[0];
        }
    } catch (error) {
        console.error('Erro ao buscar receita:', error);
    }
    return null;
}

async function generateMealPlan() {
    showToast('Gerando cardápio baseado em receitas reais...', 'success');
    
    const budget = appData.weeklyBudget;
    const people = appData.peopleCount;
    const preferences = appData.preferences;
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const categories = ['Beef', 'Chicken', 'Seafood', 'Pork', 'Vegetarian', 'Pasta', 'Side'];
    
    // Mapear orçamento para categorias
    let lunchCategory = 'Chicken';
    let dinnerCategory = 'Vegetarian';
    
    if (preferences.vegetarian) {
        lunchCategory = 'Vegetarian';
        dinnerCategory = 'Vegetarian';
    } else if (budget / people > 150) {
        lunchCategory = 'Beef';
        dinnerCategory = 'Seafood';
    }
    
    for (const day of days) {
        appData.mealPlan[day] = [];
        
        // Café da manhã (simples por enquanto)
        appData.mealPlan[day].push({ time: "Café", meal: "Café com pão e frutas" });
        
        // Almoço
        const lunch = await fetchRandomRecipeByCategory(lunchCategory);
        if (lunch) {
            appData.mealPlan[day].push({ 
                time: "Almoço", 
                meal: await translateText(lunch.strMeal, 'en', 'pt'),
                recipeId: lunch.idMeal,
                image: lunch.strMealThumb
            });
        }
        
        // Jantar
        const dinner = await fetchRandomRecipeByCategory(dinnerCategory);
        if (dinner) {
            appData.mealPlan[day].push({ 
                time: "Jantar", 
                meal: await translateText(dinner.strMeal, 'en', 'pt'),
                recipeId: dinner.idMeal,
                image: dinner.strMealThumb
            });
        }
    }
    
    updateMealPlan();
    saveDataToStorage();
    showToast(`Cardápio real gerado para ${people} pessoas!`, 'success');
}

async function generateShoppingList() {
    showToast('Analisando cardápio para gerar lista de compras...', 'success');
    
    const ingredientsMap = new Map();
    const recipeDetailsCache = new Map();
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
        const meals = appData.mealPlan[day] || [];
        for (const meal of meals) {
            if (meal.recipeId) {
                let recipe;
                if (recipeDetailsCache.has(meal.recipeId)) {
                    recipe = recipeDetailsCache.get(meal.recipeId);
                } else {
                    const response = await fetch(`${MEAL_DB_API}/lookup.php?i=${meal.recipeId}`);
                    const data = await response.json();
                    recipe = data.meals[0];
                    recipeDetailsCache.set(meal.recipeId, recipe);
                }
                
                if (recipe) {
                    // Extrair ingredientes (TheMealDB tem strIngredient1 até strIngredient20)
                    for (let i = 1; i <= 20; i++) {
                        const ing = recipe[`strIngredient${i}`];
                        const measure = recipe[`strMeasure${i}`];
                        
                        if (ing && ing.trim()) {
                            const translatedIng = await translateText(ing, 'en', 'pt');
                            const key = translatedIng.toLowerCase();
                            
                            if (ingredientsMap.has(key)) {
                                const existing = ingredientsMap.get(key);
                                existing.count++;
                                // Tentar somar medidas é complexo, então apenas contamos recorrências por enquanto
                            } else {
                                ingredientsMap.set(key, {
                                    name: translatedIng,
                                    quantity: 1, // Base
                                    unit: "un",
                                    count: 1,
                                    category: "Mercado"
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Adicionar itens básicos se a lista estiver vazia ou como complemento
    if (ingredientsMap.size === 0) {
        ingredientsMap.set("arroz", { name: "Arroz", quantity: 1, unit: "kg", category: "Mercado", count: 1 });
        ingredientsMap.set("feijão", { name: "Feijão", quantity: 1, unit: "kg", category: "Mercado", count: 1 });
    }
    
    appData.shoppingList = Array.from(ingredientsMap.values()).map((item, index) => {
        const bestPrice = findBestPrice(item.name);
        const basePrice = bestPrice ? bestPrice.price : 5.00;
        
        return {
            id: index + 1,
            name: item.name,
            quantity: item.count,
            unit: item.unit,
            category: item.category,
            price: basePrice * item.count,
            checked: false
        };
    });
    
    updateShoppingList();
    saveDataToStorage();
    showToast(`Lista de compras inteligente gerada: ${appData.shoppingList.length} itens!`, 'success');
}

function updateShoppingListForPeople() {
    const basePeople = 2;
    const multiplier = appData.peopleCount / basePeople;
    
    appData.shoppingList.forEach(item => {
        item.quantity = parseFloat((item.quantity * multiplier).toFixed(2));
        item.price = parseFloat((item.price * multiplier).toFixed(2));
    });
    
    updateShoppingList();
}

// ============================================
// FUNÇÕES DE COMPRAS
// ============================================

function addManualItem() {
    const name = document.getElementById('item-name').value.trim();
    const quantity = parseFloat(document.getElementById('item-quantity').value);
    const unit = document.getElementById('item-unit').value;
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value) || 0;
    
    if (!name || !quantity || quantity <= 0) {
        showToast('Por favor, preencha pelo menos o nome e a quantidade do item.', 'error');
        return;
    }
    
    const newId = appData.shoppingList.length > 0 
        ? Math.max(...appData.shoppingList.map(i => i.id)) + 1 
        : 1;
    
    const newItem = {
        id: newId,
        name: name,
        quantity: quantity,
        unit: unit,
        category: category,
        price: price,
        checked: false
    };
    
    appData.shoppingList.push(newItem);
    updateShoppingList();
    saveDataToStorage();
    
    // Limpar formulário
    document.getElementById('item-name').value = '';
    document.getElementById('item-quantity').value = '1';
    document.getElementById('item-price').value = '';
    
    // Fechar modal
    document.getElementById('item-modal').classList.remove('active');
    
    showToast('Item adicionado à lista!', 'success');
}

function editShoppingItem(id) {
    const item = appData.shoppingList.find(i => i.id === id);
    if (!item) return;
    
    const newName = prompt("Novo nome do item:", item.name);
    if (newName === null) return;
    
    const newQuantity = prompt("Nova quantidade:", item.quantity);
    if (newQuantity === null || isNaN(newQuantity)) return;
    
    const newPrice = prompt("Novo preço estimado (€):", item.price);
    if (newPrice === null || isNaN(newPrice)) return;
    
    item.name = newName;
    item.quantity = parseFloat(newQuantity);
    item.price = parseFloat(newPrice);
    
    updateShoppingList();
    saveDataToStorage();
    showToast('Item atualizado!', 'success');
}

function deleteShoppingItem(id) {
    if (confirm("Tem certeza que deseja remover este item da lista?")) {
        appData.shoppingList = appData.shoppingList.filter(item => item.id !== id);
        updateShoppingList();
        saveDataToStorage();
        showToast('Item removido!', 'success');
    }
}

function printShoppingList() {
    window.print();
}

// ============================================
// CÂMERA E ESCANEAMENTO
// ============================================

async function startCamera() {
    try {
        const video = document.getElementById('video');
        const placeholder = document.getElementById('camera-placeholder');
        const startBtn = document.getElementById('start-camera');
        const captureBtn = document.getElementById('capture-photo');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment' // Câmera traseira em dispositivos móveis
            } 
        });
        
        videoStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        startBtn.style.display = 'none';
        captureBtn.style.display = 'inline-flex';
        
        showToast('Câmera ativada!', 'success');
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        showToast('Erro ao acessar câmera. Verifique as permissões.', 'error');
    }
}

async function capturePhoto() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    showToast('Foto capturada! Processando OCR...', 'success');
    
    try {
        const result = await Tesseract.recognize(canvas.toDataURL('image/png'), 'por', {
            logger: m => console.log(m)
        });
        
        const text = result.data.text;
        console.log("OCR Result:", text);
        
        if (text && text.trim()) {
            processManualReceipt(text);
            showToast('OCR concluído com sucesso!', 'success');
        } else {
            showToast('Não foi possível extrair texto da imagem.', 'error');
        }
        
        stopCamera();
    } catch (error) {
        console.error('Erro no OCR:', error);
        showToast('Erro ao processar imagem.', 'error');
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    
    const video = document.getElementById('video');
    const placeholder = document.getElementById('camera-placeholder');
    const startBtn = document.getElementById('start-camera');
    const captureBtn = document.getElementById('capture-photo');
    
    video.srcObject = null;
    video.style.display = 'none';
    placeholder.style.display = 'block';
    startBtn.style.display = 'inline-flex';
    captureBtn.style.display = 'none';
}

function processReceiptText(text) {
    const lines = text.split('\n').filter(line => line.trim().length > 3);
    const items = [];
    
    // Expressão regular melhorada para capturar Nome e Preço (formato: Nome ... € 0,00 ou Nome 0,00)
    const priceRegex = /(.*?)\s*[€$R]?\s*(\d+[.,]\d{2})/;
    
    lines.forEach(line => {
        const match = line.match(priceRegex);
        if (match) {
            let name = match[1].trim()
                .replace(/^[.*\- ]+/, '') // Limpar prefixos
                .substring(0, 30); // Limitar tamanho do nome
            
            const price = parseFloat(match[2].replace(',', '.'));
            
            if (name.length > 2 && price > 0) {
                items.push({ name, price });
            }
        }
    });
    
    if (items.length > 0) {
        // Converter para o formato esperado pelo processReceiptItems
        const receiptItems = items.map(item => `${item.name} 1un - € ${item.price.toFixed(2)}`);
        processReceiptItems(receiptItems);
    } else {
        showToast('Nenhum item com preço identificado. Tente novamente ou insira manualmente.', 'warning');
    }
}

function simulateReceiptScan() {
    const manualText = document.getElementById('manual-receipt').value.trim();
    if (manualText) {
        processReceiptText(manualText);
    } else {
        // Dados de exemplo realistas para o "Efeito Uau"
        const items = `
ARROZ INTEGRAL 1KG € 2,49
FEIJAO PRETO 1KG € 1,89
PEITO DE FRANGO € 5,90
LEITE MEIO GORDO € 0,85
OVOS CLASSE L 12UN € 2,15
TOMATE RAMA KG € 1,99
CEBOLA SACO 2KG € 1,45
MACARRAO ESPAGUETE € 0,95
PAO DE FORMA € 1,20
IOGURTE NATURAL € 1,50`.trim();
        processReceiptText(items);
    }
}

function processReceiptItems(receiptItems) {
    receiptItems.forEach(itemText => {
        const parts = itemText.split(/ - [€R$] /);
        if (parts.length === 2) {
            const namePart = parts[0];
            const price = parseFloat(parts[1].replace(',', '.'));
            
            const nameMatch = namePart.match(/(.+?)\s*(\d+(?:[.,]\d+)?)(kg|g|L|ml|un|pacote|caixa)?$/i);
            
            let name, quantity = 1, unit = "un";
            
            if (nameMatch) {
                name = nameMatch[1].trim();
                quantity = parseFloat(nameMatch[2].replace(',', '.'));
                unit = nameMatch[3] || "un";
            } else {
                name = namePart;
            }
            
            let category = "Mercado";
            const lowerName = name.toLowerCase();
            if (lowerName.includes('tomate') || lowerName.includes('alface') || lowerName.includes('cenoura') || lowerName.includes('cebola')) {
                category = "Hortifruti";
            } else if (lowerName.includes('leite') || lowerName.includes('queijo') || lowerName.includes('iogurte')) {
                category = "Laticínios";
            } else if (lowerName.includes('frango') || lowerName.includes('carne') || lowerName.includes('peixe')) {
                category = "Açougue";
            } else if (lowerName.includes('pão')) {
                category = "Padaria";
            }
            
            const newId = appData.shoppingList.length > 0 
                ? Math.max(...appData.shoppingList.map(i => i.id)) + 1 
                : 1;
            
            const newItem = {
                id: newId,
                name: name,
                quantity: quantity,
                unit: unit,
                category: category,
                price: price,
                checked: true
            };
            
            appData.shoppingList.push(newItem);
        }
    });
    
    const total = receiptItems.reduce((sum, item) => {
        const price = parseFloat(item.split(/ - [€R$] /)[1]?.replace(',', '.') || '0');
        return sum + price;
    }, 0);
    
    const newExpense = {
        id: appData.expenses.length > 0 ? Math.max(...appData.expenses.map(e => e.id)) + 1 : 1,
        date: formatDate(new Date()),
        store: "Supermercado",
        amount: total,
        items: receiptItems.length
    };
    
    appData.expenses.unshift(newExpense);
    
    updateShoppingList();
    updateExpenses();
    saveDataToStorage();
    
    closeAllModals();
    
    showToast(`Nota fiscal processada: ${receiptItems.length} itens adicionados! Total: ${formatCurrency(total)}`, 'success');
}

function closeAllModals() {
    stopCamera();
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

// ============================================
// DESPESAS
// ============================================

function addExpense() {
    const store = prompt("Nome do estabelecimento:");
    if (!store) return;
    
    const amount = prompt("Valor total (€):");
    if (!amount || isNaN(amount)) return;
    
    const newId = appData.expenses.length > 0 
        ? Math.max(...appData.expenses.map(e => e.id)) + 1 
        : 1;
    
    const newExpense = {
        id: newId,
        date: formatDate(new Date()),
        store: store,
        amount: parseFloat(amount),
        items: 0
    };
    
    appData.expenses.unshift(newExpense);
    updateExpenses();
    updateCharts();
    saveDataToStorage();
    showToast('Despesa adicionada com sucesso!', 'success');
}

// ============================================
// GRÁFICOS
// ============================================

function updateCharts() {
    updateCategoryChart();
    updateTrendChart();
}

function updateCategoryChart() {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;
    
    // Agrupar despesas por categoria (simulado - você pode melhorar isso)
    const categories = {};
    appData.shoppingList.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = 0;
        }
        categories[item.category] += item.price;
    });
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Gastos por Categoria',
                data: Object.values(categories),
                backgroundColor: [
                    '#2e7d32',
                    '#4caf50',
                    '#ff9800',
                    '#2196f3',
                    '#9c27b0',
                    '#f44336',
                    '#ffc107'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function updateTrendChart() {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    
    // Agrupar despesas por semana
    const weeklyData = {};
    appData.expenses.forEach(expense => {
        const date = new Date(expense.date);
        const week = getWeekNumber(date);
        const key = `Semana ${week}`;
        
        if (!weeklyData[key]) {
            weeklyData[key] = 0;
        }
        weeklyData[key] += expense.amount;
    });
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(weeklyData),
            datasets: [{
                label: 'Gastos Semanais',
                data: Object.values(weeklyData),
                borderColor: '#2e7d32',
                backgroundColor: 'rgba(46, 125, 50, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// ============================================
// TRADUÇÃO AUTOMÁTICA
// ============================================

async function translateText(text, fromLang = 'pt', toLang = 'en') {
    if (!text || text.trim() === '') return text;
    
    // Verificar dicionário primeiro
    const lowerText = text.toLowerCase().trim();
    if (fromLang === 'pt' && toLang === 'en' && foodTranslationDict[lowerText]) {
        return foodTranslationDict[lowerText];
    }
    
    // Tentar tradução via API
    try {
        const response = await fetch(`${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`);
        const data = await response.json();
        if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
        }
    } catch (error) {
        console.error('Erro na tradução:', error);
    }
    
    return text; // Retornar original se falhar
}

async function translateRecipeToPortuguese(recipe) {
    if (recipe.source === 'spoonacular' || recipe.language === 'pt') {
        return recipe; // Já está em português
    }
    
    try {
        // Traduzir título
        if (recipe.strMeal && !recipe.strMealTranslated) {
            recipe.strMealTranslated = await translateText(recipe.strMeal, 'en', 'pt');
        }
        
        // Traduzir instruções
        if (recipe.strInstructions && !recipe.strInstructionsTranslated) {
            recipe.strInstructionsTranslated = await translateText(recipe.strInstructions, 'en', 'pt');
        }
        
        // Traduzir categoria
        if (recipe.strCategory && !recipe.strCategoryTranslated) {
            recipe.strCategoryTranslated = await translateText(recipe.strCategory, 'en', 'pt');
        }
        
        recipe.language = 'pt';
        recipe.translated = true;
    } catch (error) {
        console.error('Erro ao traduzir receita:', error);
    }
    
    return recipe;
}

function translateSearchTerm(searchTerm) {
    const lowerTerm = searchTerm.toLowerCase().trim();
    
    // Verificar dicionário
    if (foodTranslationDict[lowerTerm]) {
        return {
            pt: searchTerm,
            en: foodTranslationDict[lowerTerm]
        };
    }
    
    // Se não encontrar no dicionário, retornar o termo original
    // A API de tradução será chamada durante a busca
    return {
        pt: searchTerm,
        en: searchTerm
    };
}

// ============================================
// API DE RECEITAS - THEMEALDB E SPOONACULAR
// ============================================

async function searchRecipesOnline() {
    const searchTerm = document.getElementById('recipe-search').value.trim();
    const category = document.getElementById('recipe-category').value;
    const loading = document.getElementById('recipe-loading');
    const library = document.getElementById('recipe-library');
    
    loading.style.display = 'block';
    library.innerHTML = '';
    
    try {
        let recipes = [];
        let spoonacularRecipes = [];
        let mealDbRecipes = [];
        
        // Buscar em ambas as APIs
        if (searchTerm) {
            // Traduzir termo de busca para inglês
            const translatedTerms = translateSearchTerm(searchTerm);
            const englishTerm = await translateText(searchTerm, 'pt', 'en');
            
            // Buscar no TheMealDB (inglês)
            try {
                const mealDbResponse = await fetch(`${MEAL_DB_API}/search.php?s=${encodeURIComponent(englishTerm)}`);
                const mealDbData = await mealDbResponse.json();
                if (mealDbData.meals) {
                    mealDbRecipes = mealDbData.meals.map(meal => ({ ...meal, source: 'themealdb', language: 'en' }));
                }
            } catch (e) {
                console.error('Erro ao buscar no TheMealDB:', e);
            }
            
            // Buscar no Spoonacular (português)
            try {
                const spoonacularResponse = await fetch(
                    `${SPOONACULAR_API}/recipes/complexSearch?query=${encodeURIComponent(searchTerm)}&number=10&language=pt&apiKey=${SPOONACULAR_API_KEY}`
                );
                const spoonacularData = await spoonacularResponse.json();
                if (spoonacularData.results) {
                    // Buscar detalhes de cada receita
                    const detailsPromises = spoonacularData.results.map(recipe => 
                        fetch(`${SPOONACULAR_API}/recipes/${recipe.id}/information?language=pt&apiKey=${SPOONACULAR_API_KEY}`)
                            .then(r => r.json())
                            .catch(() => null)
                    );
                    const details = await Promise.all(detailsPromises);
                    spoonacularRecipes = details.filter(Boolean).map(recipe => ({ ...recipe, source: 'spoonacular', language: 'pt' }));
                }
            } catch (e) {
                console.error('Erro ao buscar no Spoonacular:', e);
            }
        } else if (category) {
            // Buscar por categoria no TheMealDB
            try {
                const mealDbResponse = await fetch(`${MEAL_DB_API}/filter.php?c=${encodeURIComponent(category)}`);
                const mealDbData = await mealDbResponse.json();
                if (mealDbData.meals) {
                    const detailsPromises = mealDbData.meals.slice(0, 6).map(meal => 
                        fetch(`${MEAL_DB_API}/lookup.php?i=${meal.idMeal}`).then(r => r.json())
                    );
                    const details = await Promise.all(detailsPromises);
                    mealDbRecipes = details.map(d => ({ ...d.meals[0], source: 'themealdb' })).filter(Boolean);
                }
            } catch (e) {
                console.error('Erro ao buscar no TheMealDB:', e);
            }
            
            // Buscar no Spoonacular por tipo de prato
            try {
                const spoonacularResponse = await fetch(
                    `${SPOONACULAR_API}/recipes/complexSearch?type=${encodeURIComponent(category)}&number=6&language=pt&apiKey=${SPOONACULAR_API_KEY}`
                );
                const spoonacularData = await spoonacularResponse.json();
                if (spoonacularData.results) {
                    const detailsPromises = spoonacularData.results.map(recipe => 
                        fetch(`${SPOONACULAR_API}/recipes/${recipe.id}/information?language=pt&apiKey=${SPOONACULAR_API_KEY}`)
                            .then(r => r.json())
                            .catch(() => null)
                    );
                    const details = await Promise.all(detailsPromises);
                    spoonacularRecipes = details.filter(Boolean).map(recipe => ({ ...recipe, source: 'spoonacular', language: 'pt' }));
                }
            } catch (e) {
                console.error('Erro ao buscar no Spoonacular:', e);
            }
        } else {
            // Buscar receitas aleatórias em ambas as APIs
            try {
                const randomPromises = Array.from({ length: 6 }, () => 
                    fetch(`${MEAL_DB_API}/random.php`).then(r => r.json())
                );
                const randomData = await Promise.all(randomPromises);
                mealDbRecipes = randomData.map(d => ({ ...d.meals[0], source: 'themealdb', language: 'en' })).filter(Boolean);
            } catch (e) {
                console.error('Erro ao buscar no TheMealDB:', e);
            }
            
            try {
                const spoonacularResponse = await fetch(
                    `${SPOONACULAR_API}/recipes/random?number=6&language=pt&apiKey=${SPOONACULAR_API_KEY}`
                );
                const spoonacularData = await spoonacularResponse.json();
                if (spoonacularData.recipes) {
                    spoonacularRecipes = spoonacularData.recipes.map(recipe => ({ ...recipe, source: 'spoonacular' }));
                }
            } catch (e) {
                console.error('Erro ao buscar no Spoonacular:', e);
            }
        }
        
        // Combinar receitas de ambas as fontes
        recipes = [...mealDbRecipes, ...spoonacularRecipes];
        
        if (recipes.length === 0) {
            library.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Nenhuma receita encontrada.</p>';
        } else {
            // Traduzir receitas em inglês para português
            const translationPromises = recipes.map(async (recipe) => {
                if (recipe.language === 'en' || (recipe.source === 'themealdb' && !recipe.language)) {
                    return await translateRecipeToPortuguese(recipe);
                }
                return recipe;
            });
            
            const translatedRecipes = await Promise.all(translationPromises);
            
            translatedRecipes.forEach(recipe => {
                const card = createRecipeCardFromAPI(recipe);
                library.appendChild(card);
            });
            
            // Salvar receitas
            appData.recipes = translatedRecipes;
            saveDataToStorage();
        }
    } catch (error) {
        console.error('Erro ao buscar receitas:', error);
        library.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--danger-color);">Erro ao carregar receitas. Tente novamente.</p>';
        showToast('Erro ao buscar receitas', 'error');
    } finally {
        loading.style.display = 'none';
    }
}

function createRecipeCardFromAPI(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    let imgUrl, title, category, recipeId, source, language;
    
    if (recipe.source === 'spoonacular') {
        imgUrl = recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
        title = recipe.title || recipe.name;
        category = recipe.dishTypes?.[0] || recipe.cuisines?.[0] || 'Geral';
        recipeId = recipe.id;
        source = 'spoonacular';
        language = recipe.language || 'pt';
    } else {
        imgUrl = recipe.strMealThumb || recipe.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80';
        title = recipe.strMealTranslated || recipe.strMeal || recipe.name;
        category = recipe.strCategoryTranslated || recipe.strCategory || 'Geral';
        recipeId = recipe.idMeal || recipe.id;
        source = recipe.source || 'themealdb';
        language = recipe.language || (recipe.translated ? 'pt' : 'en');
    }
    
    card.innerHTML = `
        <div class="recipe-img" style="background-image: url('${imgUrl}');"></div>
        <div class="recipe-info">
            <div class="recipe-title">${title}</div>
            <div class="recipe-meta">
                <span><i class="fas fa-tag"></i> ${category}</span>
                <span><i class="fas fa-language"></i> ${language === 'pt' ? 'PT' : 'EN'} ${recipe.translated ? '🔄' : ''}</span>
            </div>
            <button class="btn btn-outline" style="margin-top: 10px; width: 100%; font-size: 0.9rem;" onclick="showRecipeDetails('${recipeId}', '${source}')">
                <i class="fas fa-eye"></i> Ver Detalhes
            </button>
        </div>
    `;
    
    return card;
}

async function showRecipeDetails(recipeId, source = 'themealdb') {
    try {
        const modal = document.getElementById('recipe-modal');
        const modalTitle = document.getElementById('recipe-modal-title');
        const modalBody = document.getElementById('recipe-modal-body');
        
        let recipe, ingredients = [], instructions = '', image = '', title = '', category = '';
        
        if (source === 'spoonacular') {
            const response = await fetch(`${SPOONACULAR_API}/recipes/${recipeId}/information?language=pt&apiKey=${SPOONACULAR_API_KEY}`);
            recipe = await response.json();
            
            title = recipe.title || recipe.name;
            image = recipe.image || '';
            category = recipe.dishTypes?.[0] || recipe.cuisines?.[0] || 'Geral';
            instructions = recipe.instructions || recipe.summary || 'Instruções não disponíveis.';
            
            if (recipe.extendedIngredients) {
                ingredients = recipe.extendedIngredients.map(ing => 
                    `${ing.amount} ${ing.unit} ${ing.name}`
                );
            }
        } else {
            const response = await fetch(`${MEAL_DB_API}/lookup.php?i=${recipeId}`);
            const data = await response.json();
            
            if (!data.meals || data.meals.length === 0) {
                showToast('Receita não encontrada', 'error');
                return;
            }
            
            recipe = data.meals[0];
            
            // Traduzir automaticamente para português
            title = await translateText(recipe.strMeal, 'en', 'pt');
            image = recipe.strMealThumb;
            category = await translateText(recipe.strCategory, 'en', 'pt');
            instructions = await translateText(recipe.strInstructions, 'en', 'pt');
            
            for (let i = 1; i <= 20; i++) {
                const ingredient = recipe[`strIngredient${i}`];
                const measure = recipe[`strMeasure${i}`];
                if (ingredient && ingredient.trim()) {
                    const translatedIngredient = await translateText(ingredient, 'en', 'pt');
                    ingredients.push(`${measure || ''} ${translatedIngredient}`.trim());
                }
            }
        }
        
        modalTitle.innerHTML = `<i class="fas fa-book"></i> ${title}`;
        modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${image}" alt="${title}" style="max-width: 100%; border-radius: var(--radius);">
            </div>
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-dark); margin-bottom: 10px;"><i class="fas fa-info-circle"></i> Informações</h4>
                <p><strong>Categoria:</strong> ${category}</p>
                ${source === 'spoonacular' && recipe.readyInMinutes ? `<p><strong>Tempo de preparo:</strong> ${recipe.readyInMinutes} minutos</p>` : ''}
                ${source === 'spoonacular' && recipe.servings ? `<p><strong>Porções:</strong> ${recipe.servings}</p>` : ''}
                ${source === 'themealdb' && recipe.strArea ? `<p><strong>Origem:</strong> ${recipe.strArea}</p>` : ''}
                ${source === 'themealdb' && recipe.strTags ? `<p><strong>Tags:</strong> ${recipe.strTags}</p>` : ''}
            </div>
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--primary-dark); margin-bottom: 10px;"><i class="fas fa-list"></i> Ingredientes</h4>
                <ul style="list-style: none; padding: 0;">
                    ${ingredients.map(ing => `<li style="padding: 5px 0; border-bottom: 1px dashed var(--border-color);">${ing}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 style="color: var(--primary-dark); margin-bottom: 10px;"><i class="fas fa-book-open"></i> Instruções</h4>
                <p style="white-space: pre-line; line-height: 1.8;">${instructions}</p>
            </div>
            ${source === 'themealdb' && recipe.strYoutube ? `
                <div style="margin-top: 20px; text-align: center;">
                    <a href="${recipe.strYoutube}" target="_blank" class="btn btn-primary">
                        <i class="fab fa-youtube"></i> Ver no YouTube
                    </a>
                </div>
            ` : ''}
            ${source === 'spoonacular' && recipe.sourceUrl ? `
                <div style="margin-top: 20px; text-align: center;">
                    <a href="${recipe.sourceUrl}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> Ver Receita Original
                    </a>
                </div>
            ` : ''}
        `;
        
        modal.classList.add('active');
    } catch (error) {
        console.error('Erro ao carregar receita:', error);
        showToast('Erro ao carregar detalhes da receita', 'error');
    }
}

// ============================================
// EDIÇÃO DE REFEIÇÕES NO CARDÁPIO
// ============================================

function editMeal(day, mealIndex) {
    const meal = appData.mealPlan[day][mealIndex];
    const newTime = prompt("Horário da refeição:", meal.time);
    if (newTime === null) return;
    
    const newMeal = prompt("Nome da refeição:", meal.meal);
    if (newMeal === null) return;
    
    appData.mealPlan[day][mealIndex] = {
        time: newTime,
        meal: newMeal
    };
    
    updateMealPlan();
    saveDataToStorage();
    showToast('Refeição atualizada!', 'success');
}

function addMealToDay(day) {
    const time = prompt("Horário da refeição (ex: Café, Almoço, Jantar):");
    if (!time) return;
    
    const meal = prompt("Nome da refeição:");
    if (!meal) return;
    
    if (!appData.mealPlan[day]) {
        appData.mealPlan[day] = [];
    }
    
    appData.mealPlan[day].push({
        time: time,
        meal: meal
    });
    
    updateMealPlan();
    saveDataToStorage();
    showToast('Refeição adicionada!', 'success');
}

function deleteMeal(day, mealIndex) {
    if (confirm("Tem certeza que deseja remover esta refeição?")) {
        appData.mealPlan[day].splice(mealIndex, 1);
        updateMealPlan();
        saveDataToStorage();
        showToast('Refeição removida!', 'success');
    }
}

// ============================================
// INVENTÁRIO DA CASA
// ============================================

function updateInventory() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    inventoryList.innerHTML = '';
    
    if (appData.inventory.length === 0) {
        inventoryList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Nenhum item no inventário ainda. Marque itens como comprados na lista de compras para adicioná-los automaticamente.</p>';
        return;
    }
    
    appData.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shopping-item';
        div.innerHTML = `
            <div class="item-info" style="flex: 1;">
                <div class="item-name">${item.name}</div>
                <div class="item-details">
                    <span>${item.quantity} ${item.unit}</span>
                    <span>Categoria: ${item.category}</span>
                    <span>Adicionado em: ${new Date(item.addedDate).toLocaleDateString('pt-PT')}</span>
                </div>
            </div>
            <div class="item-actions">
                <button class="edit-item" onclick="editInventoryItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-item" onclick="deleteInventoryItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        inventoryList.appendChild(div);
    });
}

function addToInventory(item) {
    // Verificar se o item já existe no inventário
    const existingItem = appData.inventory.find(inv => 
        inv.name.toLowerCase() === item.name.toLowerCase() && inv.unit === item.unit
    );
    
    if (existingItem) {
        // Atualizar quantidade
        existingItem.quantity += item.quantity;
        existingItem.addedDate = new Date().toISOString();
    } else {
        // Adicionar novo item
        const newId = appData.inventory.length > 0 
            ? Math.max(...appData.inventory.map(i => i.id)) + 1 
            : 1;
        
        appData.inventory.push({
            id: newId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            addedDate: new Date().toISOString()
        });
    }
    
    updateInventory();
    saveDataToStorage();
}

function editInventoryItem(id) {
    const item = appData.inventory.find(i => i.id === id);
    if (!item) return;
    
    const newQuantity = prompt("Nova quantidade:", item.quantity);
    if (newQuantity === null || isNaN(newQuantity)) return;
    
    item.quantity = parseFloat(newQuantity);
    updateInventory();
    saveDataToStorage();
    showToast('Item atualizado!', 'success');
}

function deleteInventoryItem(id) {
    if (confirm("Tem certeza que deseja remover este item do inventário?")) {
        appData.inventory = appData.inventory.filter(item => item.id !== id);
        updateInventory();
        saveDataToStorage();
        showToast('Item removido!', 'success');
    }
}

// ============================================
// PROMOÇÕES DE SUPERMERCADOS - SISTEMA INTELIGENTE
// ============================================

// Base de dados de produtos com preços reais e categorias
const productDatabase = {
    'Azeite': {
        category: 'Mercado',
        unit: 'L',
        stores: {
            'Aldi': { price: 6.19, quantity: 0.75, unit: 'L', isPromotion: true, originalPrice: 7.50 },
            'Intermarché': { price: 7.64, quantity: 0.75, unit: 'L', isPromotion: true, originalPrice: 8.99 },
            'Auchan': { price: 6.99, quantity: 0.75, unit: 'L', isPromotion: false },
            'Mercado de Azambuja': { price: 7.20, quantity: 0.75, unit: 'L', isPromotion: false }
        }
    },
    'Arroz': {
        category: 'Mercado',
        unit: 'kg',
        stores: {
            'Aldi': { price: 1.19, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 1.49 },
            'Intermarché': { price: 1.29, quantity: 1, unit: 'kg', isPromotion: false },
            'Auchan': { price: 1.15, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 1.35 },
            'Mercado de Azambuja': { price: 1.39, quantity: 1, unit: 'kg', isPromotion: false }
        }
    },
    'Feijão': {
        category: 'Mercado',
        unit: 'kg',
        stores: {
            'Aldi': { price: 1.89, quantity: 1, unit: 'kg', isPromotion: false },
            'Intermarché': { price: 1.79, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 2.09 },
            'Auchan': { price: 1.95, quantity: 1, unit: 'kg', isPromotion: false },
            'Mercado de Azambuja': { price: 1.99, quantity: 1, unit: 'kg', isPromotion: false }
        }
    },
    'Leite': {
        category: 'Laticínios',
        unit: 'L',
        stores: {
            'Aldi': { price: 0.65, quantity: 1, unit: 'L', isPromotion: false },
            'Intermarché': { price: 0.69, quantity: 1, unit: 'L', isPromotion: true, originalPrice: 0.79 },
            'Auchan': { price: 0.62, quantity: 1, unit: 'L', isPromotion: true, originalPrice: 0.72 },
            'Mercado de Azambuja': { price: 0.75, quantity: 1, unit: 'L', isPromotion: false }
        }
    },
    'Ovos': {
        category: 'Mercado',
        unit: 'un',
        stores: {
            'Aldi': { price: 2.19, quantity: 12, unit: 'un', isPromotion: true, originalPrice: 2.49 },
            'Intermarché': { price: 2.39, quantity: 12, unit: 'un', isPromotion: false },
            'Auchan': { price: 2.15, quantity: 12, unit: 'un', isPromotion: false },
            'Mercado de Azambuja': { price: 2.49, quantity: 12, unit: 'un', isPromotion: false }
        }
    },
    'Frango': {
        category: 'Açougue',
        unit: 'kg',
        stores: {
            'Aldi': { price: 4.99, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 5.99 },
            'Intermarché': { price: 5.49, quantity: 1, unit: 'kg', isPromotion: false },
            'Auchan': { price: 4.79, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 5.49 },
            'Mercado de Azambuja': { price: 5.99, quantity: 1, unit: 'kg', isPromotion: false }
        }
    },
    'Tomate': {
        category: 'Hortifruti',
        unit: 'kg',
        stores: {
            'Aldi': { price: 1.99, quantity: 1, unit: 'kg', isPromotion: false },
            'Intermarché': { price: 1.89, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 2.19 },
            'Auchan': { price: 1.79, quantity: 1, unit: 'kg', isPromotion: false },
            'Mercado de Azambuja': { price: 2.29, quantity: 1, unit: 'kg', isPromotion: false }
        }
    },
    'Banana': {
        category: 'Hortifruti',
        unit: 'kg',
        stores: {
            'Aldi': { price: 1.29, quantity: 1, unit: 'kg', isPromotion: false },
            'Intermarché': { price: 1.19, quantity: 1, unit: 'kg', isPromotion: true, originalPrice: 1.49 },
            'Auchan': { price: 1.15, quantity: 1, unit: 'kg', isPromotion: false },
            'Mercado de Azambuja': { price: 1.39, quantity: 1, unit: 'kg', isPromotion: false }
        }
    }
};

function findBestPrice(productName) {
    const product = productDatabase[productName];
    if (!product) return null;
    
    let bestPrice = Infinity;
    let bestStore = null;
    let bestData = null;
    
    Object.entries(product.stores).forEach(([store, data]) => {
        if (data.price < bestPrice) {
            bestPrice = data.price;
            bestStore = store;
            bestData = data;
        }
    });
    
    return {
        product: productName,
        store: bestStore,
        price: bestPrice,
        data: bestData,
        category: product.category
    };
}

function comparePricesByCategory(category) {
    const categoryProducts = Object.entries(productDatabase)
        .filter(([name, data]) => data.category === category)
        .map(([name, data]) => {
            const best = findBestPrice(name);
            return {
                product: name,
                bestPrice: best,
                allPrices: Object.entries(data.stores).map(([store, storeData]) => ({
                    store,
                    price: storeData.price,
                    isPromotion: storeData.isPromotion,
                    originalPrice: storeData.originalPrice
                }))
            };
        });
    
    return categoryProducts;
}

// ============================================
// RASTREADOR DE PREÇOS - PORTUGAL
// ============================================

const PriceTracker = {
    async searchInContinente(query) {
        try {
            // Continente tem um endpoint que retorna JSON de pesquisa
            const url = `${CORS_PROXY}${encodeURIComponent(SUPERMARKETS.CONTINENTE.searchUrl + query + SUPERMARKETS.CONTINENTE.jsonSuffix)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.products && data.products.length > 0) {
                return data.products.slice(0, 3).map(p => ({
                    store: 'Continente',
                    name: p.name,
                    price: parseFloat(p.price.replace('€', '').replace(',', '.')),
                    image: p.image,
                    link: p.link,
                    isPromotion: p.isPromotion || false
                }));
            }
        } catch (e) {
            console.warn('Erro ao buscar no Continente:', e);
        }
        return [];
    },

    async searchInAuchan(query) {
        try {
            // Auchan é mais complexo, aqui simulamos o parsing ou usamos um fallback inteligente
            // Em uma implementação real, usaríamos um seletor de DOM via proxy se o JSON falhar
            const url = `${CORS_PROXY}${encodeURIComponent(SUPERMARKETS.AUCHAN.searchUrl + query)}`;
            const response = await fetch(url);
            const html = await response.text();
            
            // Parsing simples do HTML retornado pelo proxy (demonstração técnica)
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const products = doc.querySelectorAll('.auc-product-tile'); // Seletor genérico
            
            const results = [];
            products.forEach((p, i) => {
                if (i < 3) {
                    const name = p.querySelector('.auc-product-tile__name')?.textContent.trim();
                    const priceText = p.querySelector('.auc-price__value')?.textContent.trim();
                    if (name && priceText) {
                        results.push({
                            store: 'Auchan',
                            name: name,
                            price: parseFloat(priceText.replace('€', '').replace(',', '.')),
                            isPromotion: !!p.querySelector('.auc-promo-badge')
                        });
                    }
                }
            });
            return results;
        } catch (e) {
            console.warn('Erro ao buscar no Auchan:', e);
        }
        return [];
    },

    async comparePrices(productName) {
        showToast(`Buscando preços para "${productName}" em Portugal...`, 'success');
        
        const results = await Promise.all([
            this.searchInContinente(productName),
            this.searchInAuchan(productName)
        ]);
        
        const allResults = results.flat().sort((a, b) => a.price - b.price);
        
        if (allResults.length > 0) {
            this.showComparisonResult(productName, allResults);
        } else {
            showToast('Nenhum resultado encontrado nos mercados selecionados.', 'warning');
        }
    },

    showComparisonResult(productName, results) {
        // Criar ou atualizar um modal de comparação
        let modal = document.getElementById('comparison-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'comparison-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>Comparação de Preços: <span id="comp-product-name"></span></h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="comparison-results-list" class="comparison-list">
                            <!-- Resultados aparecerão aqui -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.close-modal').onclick = () => modal.classList.remove('active');
        }

        document.getElementById('comp-product-name').textContent = productName;
        const list = document.getElementById('comparison-results-list');
        list.innerHTML = results.map(r => `
            <div class="comparison-item ${r.isPromotion ? 'is-promo' : ''}">
                <div class="comp-store">${r.store}</div>
                <div class="comp-name">${r.name}</div>
                <div class="comp-price">
                    ${r.isPromotion ? '<span class="promo-badge">PROMO</span>' : ''}
                    € ${r.price.toFixed(2)}
                </div>
            </div>
        `).join('');

        modal.classList.add('active');
    }
};

async function loadPromotions() {
    if (!appData.settings.notifications.promotions) {
        return;
    }
    
    try {
        const stores = ['Intermarché', 'Aldi', 'Auchan', 'Mercado de Azambuja'];
        const promotions = [];
        
        // Criar promoções inteligentes baseadas na base de dados
        stores.forEach(store => {
            const storeItems = [];
            
            // Buscar produtos em promoção neste supermercado
            Object.entries(productDatabase).forEach(([productName, productData]) => {
                const storeData = productData.stores[store];
                if (storeData && storeData.isPromotion) {
                    const discount = storeData.originalPrice 
                        ? Math.round(((storeData.originalPrice - storeData.price) / storeData.originalPrice) * 100)
                        : 0;
                    
                    storeItems.push({
                        name: productName,
                        category: productData.category,
                        price: storeData.price,
                        originalPrice: storeData.originalPrice,
                        discount: `${discount}%`,
                        quantity: storeData.quantity,
                        unit: storeData.unit,
                        isBestPrice: findBestPrice(productName).store === store
                    });
                }
            });
            
            if (storeItems.length > 0) {
                promotions.push({
                    store: store,
                    title: `Promoções ${store}`,
                    description: `${storeItems.length} produtos em oferta`,
                    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    items: storeItems.sort((a, b) => {
                        // Ordenar: melhor preço primeiro, depois por desconto
                        if (a.isBestPrice && !b.isBestPrice) return -1;
                        if (!a.isBestPrice && b.isBestPrice) return 1;
                        return parseFloat(b.discount) - parseFloat(a.discount);
                    })
                });
            }
        });
        
        appData.promotions = promotions;
        displayPromotions();
        saveDataToStorage();
    } catch (error) {
        console.error('Erro ao carregar promoções:', error);
    }
}

function displayPromotions() {
    const promotionsList = document.getElementById('promotions-list');
    if (!promotionsList) return;
    
    promotionsList.innerHTML = '';
    
    if (appData.promotions.length === 0) {
        promotionsList.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-light);">Nenhuma promoção encontrada no momento. Clique em "Atualizar" para buscar novas ofertas.</p>';
        return;
    }
    
    // Agrupar por categoria e mostrar comparações inteligentes
    const categories = {};
    appData.promotions.forEach(promo => {
        promo.items.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push({
                ...item,
                store: promo.store
            });
        });
    });
    
    // Mostrar comparação inteligente por categoria
    Object.entries(categories).forEach(([category, items]) => {
        const categoryCard = document.createElement('div');
        categoryCard.style.cssText = 'background-color: #f9f9f9; border-radius: var(--radius); padding: 20px; margin-bottom: 25px; border-left: 4px solid var(--primary-color);';
        
        // Encontrar melhor preço na categoria
        const bestPrices = {};
        items.forEach(item => {
            const best = findBestPrice(item.name);
            if (best && (!bestPrices[item.name] || best.price < bestPrices[item.name].price)) {
                bestPrices[item.name] = {
                    product: item.name,
                    store: best.store,
                    price: best.price,
                    quantity: best.data.quantity,
                    unit: best.data.unit
                };
            }
        });
        
        categoryCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: var(--primary-dark);">
                    <i class="fas fa-tags"></i> ${category} - Comparação de Preços
                </h4>
                <span style="background-color: var(--primary-color); color: white; padding: 5px 10px; border-radius: var(--radius); font-size: 0.8rem; font-weight: 600;">
                    ${Object.keys(bestPrices).length} produtos comparados
                </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">
                ${Object.entries(bestPrices).map(([productName, best]) => {
                    const allStores = productDatabase[productName]?.stores || {};
                    const comparison = Object.entries(allStores).map(([store, data]) => ({
                        store,
                        price: data.price,
                        isPromotion: data.isPromotion,
                        originalPrice: data.originalPrice,
                        isBest: store === best.store
                    })).sort((a, b) => a.price - b.price);
                    
                    return `
                        <div style="background-color: white; padding: 15px; border-radius: var(--radius); border: 2px solid ${best.store === comparison[0].store ? 'var(--success-color)' : 'var(--border-color)'};">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                                <div>
                                    <div style="font-weight: 600; color: var(--primary-dark); font-size: 1.1rem; margin-bottom: 5px;">
                                        ${productName}
                                        ${best.store === comparison[0].store ? '<span style="color: var(--success-color); margin-left: 5px;">🏆</span>' : ''}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-light);">
                                        ${best.quantity} ${best.unit}
                                    </div>
                                </div>
                                ${best.store === comparison[0].store ? `
                                    <span style="background-color: var(--success-color); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                        MELHOR PREÇO
                                    </span>
                                ` : ''}
                            </div>
                            
                            <div style="margin-bottom: 10px;">
                                <div style="font-size: 1.3rem; font-weight: 700; color: var(--success-color);">
                                    ${formatCurrency(best.price)}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 3px;">
                                    <i class="fas fa-store"></i> ${best.store}
                                </div>
                            </div>
                            
                            <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px;">
                                <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 5px;">Outros preços:</div>
                                ${comparison.filter(c => c.store !== best.store).slice(0, 2).map(comp => `
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 3px;">
                                        <span>${comp.store}:</span>
                                        <span style="color: ${comp.price < best.price ? 'var(--success-color)' : 'var(--text-light)'};">
                                            ${formatCurrency(comp.price)}
                                            ${comp.isPromotion ? ` <span style="color: var(--danger-color); font-size: 0.75rem;">(${Math.round(((comp.originalPrice - comp.price) / comp.originalPrice) * 100)}%)</span>` : ''}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        promotionsList.appendChild(categoryCard);
    });
    
    // Mostrar promoções por loja também
    appData.promotions.forEach(promo => {
        const promoCard = document.createElement('div');
        promoCard.style.cssText = 'background-color: #f9f9f9; border-radius: var(--radius); padding: 20px; margin-bottom: 20px; border-left: 4px solid var(--secondary-color);';
        
        const validUntil = new Date(promo.validUntil);
        const daysLeft = Math.ceil((validUntil - new Date()) / (1000 * 60 * 60 * 24));
        
        promoCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <h4 style="color: var(--primary-dark); margin-bottom: 5px;">
                        <i class="fas fa-store"></i> ${promo.store}
                    </h4>
                    <p style="color: var(--text-light); font-size: 0.9rem;">${promo.description}</p>
                </div>
                <span style="background-color: var(--secondary-color); color: white; padding: 5px 10px; border-radius: var(--radius); font-size: 0.8rem; font-weight: 600;">
                    ${daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirada'}
                </span>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;">
                ${promo.items.map(item => {
                    const best = findBestPrice(item.name);
                    const isBestPrice = best && best.store === promo.store;
                    
                    return `
                        <div style="background-color: white; padding: 12px; border-radius: var(--radius); border: 2px solid ${isBestPrice ? 'var(--success-color)' : 'var(--border-color)'}; position: relative;">
                            ${isBestPrice ? `
                                <div style="position: absolute; top: -8px; right: 10px; background-color: var(--success-color); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600;">
                                    MELHOR PREÇO
                                </div>
                            ` : ''}
                            <div style="font-weight: 600; color: var(--primary-dark); margin-bottom: 8px; font-size: 1rem;">
                                ${item.name}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 8px;">
                                ${item.quantity} ${item.unit} • ${item.category}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <div>
                                    ${item.originalPrice ? `
                                        <span style="text-decoration: line-through; color: var(--text-light); font-size: 0.85rem;">${formatCurrency(item.originalPrice)}</span>
                                    ` : ''}
                                    <span style="color: var(--success-color); font-weight: 700; font-size: 1.1rem; margin-left: ${item.originalPrice ? '8px' : '0'};">
                                        ${formatCurrency(item.price)}
                                    </span>
                                </div>
                                ${item.discount ? `
                                    <span style="background-color: var(--danger-color); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                                        ${item.discount}
                                    </span>
                                ` : ''}
                            </div>
                            ${best && best.store !== promo.store ? `
                                <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 5px; padding-top: 5px; border-top: 1px dashed var(--border-color);">
                                    <i class="fas fa-info-circle"></i> Mais barato em ${best.store}: ${formatCurrency(best.price)}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        
        promotionsList.appendChild(promoCard);
    });
    
    showToast(`${appData.promotions.length} promoções carregadas com comparação inteligente!`, 'success');
}

// ============================================
// CONFIGURAÇÕES
// ============================================

function saveSettings() {
    appData.settings.userName = document.getElementById('user-name').value;
    appData.monthlyBudget = parseFloat(document.getElementById('monthly-budget').value) || 1000;
    appData.peopleCount = parseInt(document.getElementById('settings-people').value) || 2;
    appData.settings.unitPreference = document.getElementById('unit-preference').value;
    appData.settings.notifications.shopping = document.getElementById('notif-shopping').checked;
    appData.settings.notifications.promotions = document.getElementById('notif-promotions').checked;
    appData.settings.notifications.recipes = document.getElementById('notif-recipes').checked;
    
    updatePeopleCount();
    saveDataToStorage();
    showToast('Configurações salvas!', 'success');
}

function resetSettings() {
    if (confirm("Deseja restaurar as configurações padrão?")) {
        appData.settings = {
            userName: "Família de 2 Pessoas",
            unitPreference: "g",
            notifications: {
                shopping: true,
                promotions: true,
                recipes: false
            }
        };
        appData.monthlyBudget = 1000;
        updateSettingsUI();
        saveDataToStorage();
        showToast('Configurações restauradas!', 'success');
    }
}

// ============================================
// EXPORTAÇÃO
// ============================================

function exportData() {
    const data = {
        appData: appData,
        exportDate: new Date().toISOString(),
        exportType: "Planejador Alimentar"
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `planejador-alimentar-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Dados exportados com sucesso!', 'success');
}

// ============================================
// UTILITÁRIOS
// ============================================

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// formatCurrency já foi definida no topo do arquivo

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Fechar modais ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeAllModals();
    }
});

