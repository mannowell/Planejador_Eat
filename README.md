# 🍽️ Planejador Alimentar - Cardápio & Compras

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26.svg?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6.svg?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.x-FF6384.svg?logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![TheMealDB](https://img.shields.io/badge/TheMealDB-API-20B2AA.svg)](https://www.themealdb.com/api.php)
[![FontAwesome](https://img.shields.io/badge/FontAwesome-6.0-528DD7.svg?logo=fontawesome&logoColor=white)](https://fontawesome.com/)

Sistema completo de planejamento alimentar com cardápio semanal, lista de compras inteligente, controle de despesas e integração com API de receitas.

## 📋 Funcionalidades

### ✨ Principais Recursos

- **📅 Cardápio Semanal**: Planeje refeições para a semana inteira
- **🛒 Lista de Compras Inteligente**: Organize por categoria e loja
- **💰 Controle de Despesas**: Acompanhe gastos com gráficos interativos
- **📸 Escaneamento de Notas Fiscais**: Use a câmera do celular para adicionar itens automaticamente
- **🍳 Biblioteca de Receitas**: Busque receitas reais da API TheMealDB
- **💾 Persistência de Dados**: Todos os dados são salvos localmente no navegador
- **📊 Gráficos Interativos**: Visualize gastos por categoria e tendências

## 🚀 Como Usar

### Instalação

1. Baixe ou clone este repositório
2. Abra o arquivo `index.html` no seu navegador
3. Pronto! Não precisa de servidor ou instalação

### Uso Básico

1. **Configurar Perfil**: Vá em "Configurações" e defina:
   - Número de pessoas
   - Orçamento semanal/mensal
   - Preferências alimentares

2. **Criar Cardápio**:
   - Clique em "Gerar Cardápio Automático" para criar um cardápio baseado no seu orçamento
   - Ou edite manualmente cada dia da semana

3. **Gerar Lista de Compras**:
   - Clique em "Gerar Lista de Compras" para criar uma lista baseada no cardápio
   - Adicione itens manualmente ou escaneie uma nota fiscal

4. **Registrar Compras**:
   - Adicione despesas manualmente
   - Ou use a câmera para escanear notas fiscais

5. **Explorar Receitas**:
   - Vá na aba "Receitas"
   - Busque receitas online ou explore por categoria

## 🔌 APIs Utilizadas

### 1. TheMealDB API (Receitas)

**URL Base**: `https://www.themealdb.com/api/json/v1/1`

**Endpoints Utilizados**:
- `search.php?s={nome}` - Buscar receitas por nome
- `filter.php?c={categoria}` - Filtrar por categoria
- `lookup.php?i={id}` - Obter detalhes de uma receita
- `random.php` - Receitas aleatórias

**Exemplo de Uso**:
```javascript
// Buscar receitas
fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=chicken')
  .then(response => response.json())
  .then(data => console.log(data.meals));
```

**Categorias Disponíveis**:
- Beef (Carne)
- Chicken (Frango)
- Seafood (Frutos do Mar)
- Vegetarian (Vegetariano)
- Dessert (Sobremesa)
- E muitas outras...

**Limitações**:
- API gratuita e pública
- Não requer autenticação
- Rate limit: ~5 requisições por segundo

### 2. MediaDevices API (Câmera)

**Uso**: Acesso à câmera do dispositivo para escanear notas fiscais

**Código de Exemplo**:
```javascript
// Solicitar acesso à câmera
const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
});
```

**Requisitos**:
- HTTPS (ou localhost para desenvolvimento)
- Permissão do usuário
- Navegador moderno com suporte a MediaDevices

**Navegadores Suportados**:
- Chrome/Edge (versão 53+)
- Firefox (versão 36+)
- Safari (versão 11+)
- Opera (versão 40+)

### 3. LocalStorage API (Persistência)

**Uso**: Salvar dados localmente no navegador

**Chave Utilizada**: `planejadorAlimentar`

**Estrutura dos Dados**:
```json
{
  "peopleCount": 2,
  "weeklyBudget": 250,
  "mealPlan": {...},
  "shoppingList": [...],
  "expenses": [...],
  "recipes": [...]
}
```

## 📱 Funcionalidades por Seção

### Dashboard
- Visão geral do cardápio da semana
- Preview da lista de compras
- Últimas despesas
- Estatísticas rápidas
- Sugestões de receitas econômicas

### Cardápio
- Visualização semanal completa
- Configuração de pessoas e orçamento
- Preferências alimentares
- Geração automática de cardápio

### Compras
- Lista completa de itens
- Organização por categoria/loja
- Adição manual ou por escaneamento
- Marcação de itens comprados
- Cálculo automático de totais

### Despesas
- Histórico completo de compras
- Gráficos de distribuição por categoria
- Gráfico de tendência mensal
- Estatísticas de economia
- Filtros e busca

### Receitas
- Busca online de receitas
- Filtro por categoria
- Detalhes completos (ingredientes, instruções)
- Links para vídeos no YouTube
- Adição ao cardápio

### Configurações
- Perfil do usuário
- Orçamentos
- Preferências de notificação
- Unidades de medida
- Exportar/importar dados

## 🎨 Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno e responsivo
- **JavaScript (ES6+)**: Lógica da aplicação
- **Chart.js**: Gráficos interativos
- **Font Awesome**: Ícones
- **TheMealDB API**: Receitas reais
- **LocalStorage**: Persistência de dados

## 🔧 Melhorias Implementadas

### Funcionalidades Reais (não simuladas)

1. ✅ **Persistência Real**: Dados salvos no LocalStorage
2. ✅ **API de Receitas**: Integração com TheMealDB
3. ✅ **Câmera Real**: Acesso à câmera do dispositivo
4. ✅ **Gráficos Funcionais**: Chart.js com dados reais
5. ✅ **Validações**: Tratamento de erros e validações
6. ✅ **Responsivo**: Funciona em mobile e desktop

### Melhorias de UX

- Notificações toast para feedback
- Animações suaves
- Design moderno e intuitivo
- Navegação por abas
- Modais para ações rápidas

## 📝 Estrutura de Arquivos

```
Planejador_Eat/
│
├── index.html          # Página principal
├── styles.css          # Estilos
├── app.js              # Lógica da aplicação
├── README.md           # Documentação
├── API_GUIDE.md        # Guia de APIs
```

## 🚨 Limitações e Melhorias Futuras

### Limitações Atuais

1. **OCR de Notas Fiscais**: O escaneamento usa Tesseract.js (client-side) para reconhecimento de texto. A precisão depende da qualidade da imagem e pode variar.

2. **Sincronização**: Dados apenas locais (sem nuvem)
   - Solução: Integrar com Firebase ou backend próprio

3. **Preços**: Preços são estimados/manuais
   - Solução: Integrar com APIs de supermercados

### Melhorias Sugeridas

- [ ] Sincronização em nuvem
- [ ] App mobile (PWA)
- [ ] Integração com APIs de supermercados para preços
- [ ] Sistema de notificações push
- [ ] Compartilhamento de receitas
- [ ] Modo offline completo
- [ ] Exportação para PDF
- [ ] Integração com calendário

## 👤 Autor

**Wellison Oliveira** ([@mannowell](https://github.com/mannowell))

Desenvolvido com ❤️ para facilitar o planejamento alimentar.

## 📄 Licença

Este projeto está licenciado sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos abaixo:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 🙏 Agradecimentos

- **TheMealDB**: Por fornecer a API gratuita de receitas
- **Chart.js**: Por fornecer gráficos incríveis
- **Font Awesome**: Pelos ícones

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Consulte o código comentado
3. Abra uma issue no repositório
