# 📚 Guia de APIs - Planejador Alimentar

Este documento detalha todas as APIs utilizadas e como implementar melhorias futuras.

## 🔌 APIs Atualmente Implementadas

### 1. TheMealDB API

**Status**: ✅ Implementada e Funcional

**Documentação Oficial**: https://www.themealdb.com/api.php

**Endpoints Utilizados**:

```javascript
// Buscar receitas por nome
GET https://www.themealdb.com/api/json/v1/1/search.php?s={nome}

// Filtrar por categoria
GET https://www.themealdb.com/api/json/v1/1/filter.php?c={categoria}

// Obter detalhes de uma receita
GET https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}

// Receita aleatória
GET https://www.themealdb.com/api/json/v1/1/random.php
```

**Exemplo de Resposta**:
```json
{
  "meals": [
    {
      "idMeal": "52772",
      "strMeal": "Teriyaki Chicken Casserole",
      "strCategory": "Chicken",
      "strArea": "Japanese",
      "strInstructions": "Preheat oven to 350° F...",
      "strMealThumb": "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg",
      "strIngredient1": "soy sauce",
      "strMeasure1": "3/4 cup",
      ...
    }
  ]
}
```

**Limitações**:
- Não requer autenticação
- Rate limit: ~5 requisições/segundo
- Dados em inglês (algumas receitas têm traduções)

### 2. MediaDevices API

**Status**: ✅ Implementada e Funcional

**Documentação**: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices

**Uso no Projeto**:
```javascript
// Solicitar acesso à câmera
const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { 
        facingMode: 'environment' // Câmera traseira
    } 
});
```

**Requisitos**:
- HTTPS obrigatório (exceto localhost)
- Permissão do usuário
- Navegador moderno

## 🚀 APIs Recomendadas para Melhorias Futuras

### 1. Google Cloud Vision API (OCR)

**Para**: Escaneamento real de notas fiscais

**Documentação**: https://cloud.google.com/vision/docs

**Como Implementar**:

1. **Obter API Key**:
   - Criar conta no Google Cloud
   - Ativar Vision API
   - Gerar chave de API

2. **Instalação**:
```bash
npm install @google-cloud/vision
```

3. **Código de Exemplo**:
```javascript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
    keyFilename: 'path/to/key.json'
});

async function extractTextFromImage(imageBuffer) {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    return detections[0]?.description || '';
}
```

**Alternativa Gratuita**: Tesseract.js (client-side)

```javascript
// Instalação: npm install tesseract.js
import Tesseract from 'tesseract.js';

async function extractText(image) {
    const { data: { text } } = await Tesseract.recognize(image, 'por');
    return text;
}
```

### 2. Spoonacular API (Receitas Avançadas)

**Para**: Receitas mais detalhadas com informações nutricionais

**Documentação**: https://spoonacular.com/food-api

**Vantagens**:
- Informações nutricionais
- Preços estimados
- Receitas em português
- Filtros avançados

**Limitações**:
- Requer API key (gratuita com limite)
- Rate limit: 150 requisições/dia (plano free)

**Exemplo**:
```javascript
const API_KEY = 'sua-chave-aqui';
const response = await fetch(
    `https://api.spoonacular.com/recipes/search?query=chicken&apiKey=${API_KEY}`
);
```

### 3. Firebase (Backend e Sincronização)

**Para**: Sincronização em nuvem e autenticação

**Documentação**: https://firebase.google.com/docs

**Serviços Úteis**:
- **Firestore**: Banco de dados NoSQL
- **Authentication**: Login de usuários
- **Storage**: Armazenar imagens
- **Functions**: Backend serverless

**Exemplo de Integração**:
```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "sua-chave",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Salvar dados
async function saveToCloud(data) {
    await addDoc(collection(db, 'shoppingLists'), data);
}
```

### 4. APIs de Supermercados (Preços)

#### 4.1. API do Mercado Livre

**Endpoint**: https://api.mercadolivre.com/sites/MLB/search

**Exemplo**:
```javascript
async function searchProductPrice(productName) {
    const response = await fetch(
        `https://api.mercadolivre.com/sites/MLB/search?q=${encodeURIComponent(productName)}`
    );
    const data = await response.json();
    return data.results[0]?.price || null;
}
```

#### 4.2. API do Google Shopping

**Nota**: Não há API oficial, mas pode usar scraping (com cuidado)

**Alternativa**: Web scraping com Puppeteer ou Cheerio

### 5. Chart.js (Já Implementado)

**Status**: ✅ Implementado

**Documentação**: https://www.chartjs.org/

**Uso no Projeto**:
```javascript
import Chart from 'chart.js/auto';

const chart = new Chart(ctx, {
    type: 'pie',
    data: { ... },
    options: { ... }
});
```

## 🔐 Boas Práticas de Segurança

### 1. Proteger API Keys

**❌ NUNCA faça isso**:
```javascript
const API_KEY = 'sua-chave-secreta'; // Exposta no código
```

**✅ Faça isso**:
```javascript
// Use variáveis de ambiente
const API_KEY = process.env.API_KEY;

// Ou use um backend proxy
async function callAPI(data) {
    const response = await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}
```

### 2. Rate Limiting

Implemente controle de taxa para evitar exceder limites:

```javascript
class RateLimiter {
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = [];
    }
    
    async check() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        
        if (this.requests.length >= this.maxRequests) {
            throw new Error('Rate limit exceeded');
        }
        
        this.requests.push(now);
    }
}
```

### 3. Tratamento de Erros

Sempre trate erros de API:

```javascript
async function fetchWithErrorHandling(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast('Erro ao carregar dados', 'error');
        return null;
    }
}
```

## 📊 Comparação de APIs

| API | Gratuita | Limite | Idioma | Melhor Para |
|-----|----------|--------|--------|-------------|
| TheMealDB | ✅ Sim | 5 req/s | Inglês | Receitas básicas |
| Spoonacular | ⚠️ Limitada | 150/dia | Múltiplos | Receitas avançadas |
| Google Vision | ❌ Não | Pago | Múltiplos | OCR preciso |
| Tesseract.js | ✅ Sim | Ilimitado | Múltiplos | OCR client-side |
| Firebase | ⚠️ Limitada | 50k leituras/dia | - | Backend |

## 🛠️ Implementação Passo a Passo

### Adicionar OCR Real (Tesseract.js)

1. **Instalar**:
```bash
npm install tesseract.js
```

2. **Importar no projeto**:
```javascript
import { createWorker } from 'tesseract.js';

const worker = await createWorker('por');
```

3. **Processar imagem**:
```javascript
async function processReceipt(imageFile) {
    const { data: { text } } = await worker.recognize(imageFile);
    
    // Processar texto extraído
    const items = parseReceiptText(text);
    return items;
}
```

4. **Atualizar função de captura**:
```javascript
async function capturePhoto() {
    const canvas = document.getElementById('canvas');
    const imageData = canvas.toDataURL('image/png');
    
    const items = await processReceipt(imageData);
    processReceiptItems(items);
}
```

## 📝 Notas Importantes

1. **CORS**: Algumas APIs podem ter restrições CORS. Use um proxy se necessário.

2. **Custos**: APIs pagas podem ter custos. Monitore o uso.

3. **Privacidade**: Dados de usuários devem ser tratados com cuidado.

4. **Performance**: Cache respostas quando possível.

5. **Fallbacks**: Sempre tenha alternativas caso uma API falhe.

## 🔗 Links Úteis

- [TheMealDB Docs](https://www.themealdb.com/api.php)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Chart.js Docs](https://www.chartjs.org/docs/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Google Vision API](https://cloud.google.com/vision/docs)
- [Firebase Docs](https://firebase.google.com/docs)

---

**Última atualização**: 2024

