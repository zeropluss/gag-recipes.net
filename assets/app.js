/**
 * GAG Recipe App Main Logic
 * Following modular design principles, single responsibility, easy to maintain and extend
 */

// ==================== Utility Functions Module ====================
const DOM = {
  $: (selector, root = document) => root.querySelector(selector),
  $$: (selector, root = document) => Array.from(root.querySelectorAll(selector)),
  
  createElement(tag, className = '', content = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  },
  
  showElement(element) {
    element.style.display = '';
    element.removeAttribute('hidden');
  },
  
  hideElement(element) {
    element.style.display = 'none';
    element.setAttribute('hidden', '');
  }
};

const Utils = {
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  formatTime(minutes) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  },
  
  getDifficultyLabel(difficulty) {
    const labels = {
      'Easy': 'Easy',
      'Medium': 'Medium', 
      'Hard': 'Hard'
    };
    return labels[difficulty] || difficulty;
  },
  
  getRarityClass(rarity) {
    return rarity.toLowerCase().replace(/\s+/g, '-');
  },
  
  copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback solution
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  }
};

// ==================== Data Management Module ====================
class DataManager {
  constructor() {
    this.recipes = [];
    this.isLoaded = false;
  }
  
  async loadRecipes() {
    try {
      const response = await fetch('./assets/recipes.json?v=2.6', {
        cache: 'default'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.recipes = await response.json();
      this.isLoaded = true;
      
      // 添加自检函数
      this.sanityCheck(this.recipes);
      
      return this.recipes;
    } catch (error) {
      console.error('Failed to load recipe data:', error);
      throw new Error('Unable to load recipe data, please check network connection or try again later');
    }
  }
  
  // 自检函数：检查图片路径是否与ID匹配
  sanityCheck(recipes) {
    console.log('🔍 Running sanity check...');
    recipes.forEach((recipe, index) => {
      console.log(`#${index + 1}: ${recipe.name} (${recipe.id}) → ${recipe.image}`);
    });
    
    const mismatches = recipes.filter(r => {
      return !r.image.includes(r.id);
    });
    
    if (mismatches.length) {
      console.warn('⚠️ Potential image path mismatches:', mismatches.map(r => ({
        id: r.id,
        name: r.name,
        image: r.image
      })));
    } else {
      console.log('✅ All image paths look correct');
    }
  }
  
  getRecipes() {
    return this.recipes;
  }
  
  getRecipeById(id) {
    return this.recipes.find(recipe => recipe.id === id);
  }
  
  filterRecipes(difficulty = 'All', query = '') {
    return this.recipes.filter(recipe => {
      // Difficulty filter
      const difficultyMatch = difficulty === 'All' || recipe.difficulty === difficulty;
      
      // Search filter
      const searchQuery = query.trim().toLowerCase();
      const searchMatch = !searchQuery || (
        recipe.name.toLowerCase().includes(searchQuery) ||
        recipe.baseIngredients.some(ingredient => 
          ingredient.toLowerCase().includes(searchQuery)
        ) ||
        recipe.variants.some(variant =>
          variant.ingredients.some(ingredient =>
            ingredient.toLowerCase().includes(searchQuery)
          )
        )
      );
      
      return difficultyMatch && searchMatch;
    });
  }
}

// ==================== Rendering Management Module ====================
class RenderManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.elements = {
      recipes: DOM.$('#recipes'),
      detailsBody: DOM.$('#detailsBody'),
      kpiRecipes: DOM.$('#kpiRecipes'),
      kpiIngredients: DOM.$('#kpiIngredients'),
      kpiRarities: DOM.$('#kpiRarities'),
      count: DOM.$('#count')
    };
  }
  
  renderKPI() {
    const recipes = this.dataManager.getRecipes();
    
    // 计算统计数据
    const stats = this.calculateKPIStats(recipes);
    
    // 动画更新KPI数字
    this.animateKPIValue('kpiRecipes', stats.totalRecipes);
    this.animateKPIValue('kpiIngredients', stats.uniqueIngredients, '+');
    this.animateKPIValue('kpiRarities', stats.rarityLevels);
  }
  
  calculateKPIStats(recipes) {
    // 统计总食谱数量
    const totalRecipes = recipes.length;
    
    // 统计独特食材数量
    const allIngredients = new Set();
    recipes.forEach(recipe => {
      recipe.baseIngredients.forEach(ingredient => {
        // 清理食材名称（移除数量前缀）
        const cleanIngredient = ingredient.replace(/^\d+x\s+/, '').trim();
        allIngredients.add(cleanIngredient);
      });
      
      recipe.variants.forEach(variant => {
        variant.ingredients.forEach(ingredient => {
          const cleanIngredient = ingredient.replace(/^\d+x\s+/, '').trim();
          allIngredients.add(cleanIngredient);
        });
      });
    });
    
    // 统计稀有度等级数量
    const allRarities = new Set();
    recipes.forEach(recipe => {
      recipe.variants.forEach(variant => {
        allRarities.add(variant.rarity);
      });
    });
    
    return {
      totalRecipes,
      uniqueIngredients: allIngredients.size,
      rarityLevels: allRarities.size
    };
  }
  
  animateKPIValue(elementId, targetValue, suffix = '') {
    const element = DOM.$(`#${elementId}`);
    if (!element) return;
    
    // 添加加载状态
    element.classList.add('loading');
    element.textContent = '—';
    
    // 延迟开始动画以显示加载效果
    setTimeout(() => {
      element.classList.remove('loading');
      
      // 数字递增动画
      const startValue = 0;
      const duration = 1500; // 1.5秒
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数使动画更流畅
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
        
        element.textContent = currentValue + suffix;
        element.setAttribute('data-value', currentValue + suffix);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 动画完成，确保显示最终值
          element.textContent = targetValue + suffix;
          element.setAttribute('data-value', targetValue + suffix);
        }
      };
      
      requestAnimationFrame(animate);
    }, 300);
  }
  
  renderRecipeCards(recipes) {
    if (!this.elements.recipes) return;
    
    if (recipes.length === 0) {
      this.elements.recipes.innerHTML = `
        <div class="empty-state">
          <h3>No Matching Recipes Found</h3>
          <p>Try adjusting search terms or filter options</p>
        </div>
      `;
      return;
    }
    
    this.elements.recipes.innerHTML = recipes.map(recipe => `
      <article class="recipe-card" onclick="location.href='#${recipe.id}'">
        <div class="recipe-card-image">
          <img src="${recipe.image}?v=11" alt="${recipe.name} cooking guide" loading="lazy" decoding="async" onerror="this.src='./images/placeholder.svg'">
        </div>
        
        <div class="recipe-card-content">
          <h3 class="recipe-title">${recipe.name}</h3>
          
          <div class="recipe-meta">
            <span class="difficulty">${Utils.getDifficultyLabel(recipe.difficulty)}</span>
            <span>•</span>
            <span class="duration">${Utils.formatTime(recipe.minutes)}</span>
          </div>
          
          <div class="recipe-badges">
            ${(recipe.badges || []).map(badge => `
              <span class="badge ${badge.toLowerCase().includes('popular') ? 'popular' : ''} ${badge.toLowerCase().includes('quick') ? 'quick' : ''}">${this.translateBadge(badge)}</span>
            `).join('')}
          </div>
          
          <div class="rarity-list">
            ${this.getUniqueRarities(recipe.variants).slice(0, 4).map(rarity => `
              <span class="rarity-pill ${Utils.getRarityClass(rarity)}">${this.translateRarity(rarity)}</span>
            `).join('')}
            ${recipe.variants.length > 4 ? `<span class="rarity-pill">+${recipe.variants.length - 4} more</span>` : ''}
          </div>
          
                  <div class="card-actions">
          <a href="#${recipe.id}" class="btn primary" onclick="event.stopPropagation()">View Details</a>
          <button class="btn" data-copy="${recipe.id}" onclick="event.stopPropagation()">Copy Link</button>
        </div>
      </div>
    </article>
    `).join('');
    
    // Update count
    if (this.elements.count) {
      this.elements.count.textContent = `Showing ${recipes.length} recipes`;
    }
    
    // Bind copy button events
    this.bindCopyButtons();
  }
  
  renderRecipeDetails(recipes) {
    if (!this.elements.detailsBody) return;
    
    this.elements.detailsBody.innerHTML = recipes.map(recipe => `
      <section class="recipe-detail" id="${recipe.id}">
        <div class="recipe-detail-header">
          <h3>${recipe.name}</h3>
          <span class="tag difficulty-${recipe.difficulty.toLowerCase()}">${Utils.getDifficultyLabel(recipe.difficulty)}</span>
          <span class="tag">${Utils.formatTime(recipe.minutes)}</span>
          <button class="btn" data-copy="${recipe.id}">Copy #${recipe.id}</button>
        </div>
        
        <div class="recipe-detail-content">
          <div class="recipe-columns">
            <div class="recipe-column">
              <div class="column-title">Base Ingredients</div>
              <div class="ingredient-row">
                ${recipe.baseIngredients.map(ingredient => `
                  <span class="rarity-pill">${ingredient}</span>
                `).join('')}
              </div>
            </div>
            
            <div class="recipe-column">
              <div class="column-title">Cooking Steps</div>
              <ol style="padding-left: var(--space-lg); line-height: var(--line-height-relaxed);">
                <li>Collect required ingredients</li>
                <li>Go to cooking area</li>
                <li>Press <b>E</b> key to add ingredients one by one</li>
                <li>Click <b>COOK</b> to start cooking</li>
                <li>Wait for completion then collect dish</li>
              </ol>
            </div>
            
            <div class="recipe-column">
              <div class="column-title">Rarity Recipes</div>
              ${recipe.variants.map(variant => `
                <div class="variant-item">
                  <div class="variant-rarity">${this.translateRarity(variant.rarity)}</div>
                  <div class="variant-ingredients">${variant.ingredients.join(' + ')}</div>
                </div>
              `).join('')}
            </div>
            
            <div class="recipe-column">
              <div class="column-title">Cooking Tips</div>
              <ul style="padding-left: var(--space-lg); line-height: var(--line-height-relaxed);">
                ${(recipe.tips || []).map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      </section>
    `).join('');
    
    // Bind copy button events
    this.bindCopyButtons();
  }
  
  getUniqueRarities(variants) {
    const rarities = variants.map(v => v.rarity);
    return [...new Set(rarities)];
  }
  
  translateBadge(badge) {
    const translations = {
      'Popular': 'Popular',
      'Quick': 'Quick',
      'Most Searched': 'Most Searched',
      'Prismatic Available': 'Prismatic Available',
      'Complex': 'Complex',
      'Traditional': 'Traditional',
      'Versatile': 'Versatile',
      'Sweet': 'Sweet',
      'Breakfast': 'Breakfast',
      'Healthy': 'Healthy',
      'Classic': 'Classic',
      'Seasonal': 'Seasonal'
    };
    return translations[badge] || badge;
  }
  
  translateRarity(rarity) {
    const translations = {
      'Normal': 'Normal',
      'Uncommon': 'Uncommon',
      'Rare': 'Rare',
      'Legendary': 'Legendary',
      'Mythical': 'Mythical',
      'Divine': 'Divine',
      'Prismatic': 'Prismatic'
    };
    return translations[rarity] || rarity;
  }
  
  bindCopyButtons() {
    DOM.$$('[data-copy]').forEach(button => {
      button.onclick = () => this.copyRecipeLink(button.dataset.copy);
    });
  }
  
  copyRecipeLink(recipeId) {
    const url = `${location.origin}${location.pathname}#${recipeId}`;
    Utils.copyToClipboard(url)
      .then(() => {
        this.showToast('Link copied to clipboard');
      })
      .catch(() => {
        this.showToast('Copy failed, please copy link manually');
      });
  }
  
  showToast(message) {
    // Simple Toast notification
    const toast = DOM.createElement('div', 'toast', message);
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      padding: var(--space-md) var(--space-lg);
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-primary);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-popover);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// ==================== Interaction Management Module ====================
class InteractionManager {
  constructor(dataManager, renderManager) {
    this.dataManager = dataManager;
    this.renderManager = renderManager;
    this.currentFilter = 'All';
    this.currentQuery = '';
    
    this.debouncedSearch = Utils.debounce(this.handleSearch.bind(this), 300);
  }
  
  init() {
    this.bindFilterChips();
    this.bindSearchInput();
    this.bindThemeToggle();
    this.bindHashChange();
  }
  
  bindFilterChips() {
    DOM.$$('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        // Update active state
        DOM.$$('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        
        // Update filter conditions
        this.currentFilter = chip.dataset.filter;
        this.updateRecipeDisplay();
      });
    });
  }
  
  bindSearchInput() {
    const searchInput = DOM.$('#search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentQuery = e.target.value;
        this.debouncedSearch();
      });
    }
  }
  
  bindThemeToggle() {
    const themeToggle = DOM.$('#themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', this.toggleTheme.bind(this));
      this.initTheme();
    }
  }
  
  bindHashChange() {
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
    // Also check hash on initialization
    this.handleHashChange();
  }
  
  handleSearch() {
    this.updateRecipeDisplay();
  }
  
  updateRecipeDisplay() {
    const filteredRecipes = this.dataManager.filterRecipes(
      this.currentFilter,
      this.currentQuery
    );
    this.renderManager.renderRecipeCards(filteredRecipes);
  }
  
  toggleTheme() {
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('theme');
    let newTheme;
    
    if (currentTheme === 'light') {
      newTheme = 'dark';
      html.classList.remove('theme-light');
      html.classList.add('theme-dark');
    } else {
      newTheme = 'light';
      html.classList.remove('theme-dark');
      html.classList.add('theme-light');
    }
    
    localStorage.setItem('theme', newTheme);
    this.updateThemeToggleIcon(newTheme);
  }
  
  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    document.documentElement.classList.add(`theme-${theme}`);
    this.updateThemeToggleIcon(theme);
  }
  
  updateThemeToggleIcon(theme) {
    const themeToggle = DOM.$('#themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }
  
  handleHashChange() {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    
    const element = document.getElementById(hash);
    if (element) {
      // Highlight effect
      element.style.outline = '2px solid var(--color-brand-primary)';
      element.style.outlineOffset = '4px';
      
      setTimeout(() => {
        element.style.outline = 'none';
        element.style.outlineOffset = 'initial';
      }, 2000);
      
      // Smooth scroll
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
}

// ==================== SEO Optimization Module ====================
class SEOManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
  }
  
  injectStructuredData() {
    const recipes = this.dataManager.getRecipes();
    
    // Inject HowTo structured data for each recipe
    recipes.forEach(recipe => {
      this.injectRecipeHowTo(recipe);
    });
    
    // Inject FAQ page data
    this.injectFAQPage();
  }
  
  injectRecipeHowTo(recipe) {
    const supplies = recipe.baseIngredients.map(ingredient => ({
      "@type": "HowToSupply",
      "name": ingredient.replace(/^\d+x\s+/, '').trim()
    }));
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": `How to make ${recipe.name} in Grow a Garden`,
      "description": `Detailed ${recipe.name} crafting guide with required ingredients and cooking steps`,
      "totalTime": `PT${recipe.minutes}M`,
      "recipeYield": "1 serving",
      "supply": supplies,
      "tool": [
        {
          "@type": "HowToTool",
          "name": "Cooking Pot"
        }
      ],
      "step": [
        {
          "@type": "HowToStep",
          "text": `Collect required ingredients: ${supplies.map(s => s.name).join(', ')}`
        },
        {
          "@type": "HowToStep", 
          "text": "Go to the cooking area in the lobby"
        },
        {
          "@type": "HowToStep",
          "text": "Hold each ingredient and press E key near the pot to add"
        },
        {
          "@type": "HowToStep",
          "text": "Click the green COOK button to start cooking"
        },
        {
          "@type": "HowToStep",
          "text": `Wait ${recipe.minutes} minutes, then press E key to collect your ${recipe.name}`
        }
      ],
      "image": recipe.image
    };
    
    this.addJSONLD(structuredData);
  }
  
  injectFAQPage() {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How do I start making my first GAG recipe?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We recommend starting with simple salads or ice cream. These GAG recipes only require basic ingredients and have short cooking times (5 minutes), perfect for beginners to practice the cooking process. First collect tomatoes (for salad) or corn+sweet ingredients (for ice cream) in the garden, then follow the standard GAG cooking steps."
          }
        },
        {
          "@type": "Question",
          "name": "Why are my dishes always low rarity?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The key to rarity recipes is using special ingredients. To craft high-rarity GAG recipes, you need to add Bone Blossom, Beanstalk, Violet Corn and other rare materials. For example, creating Prismatic-level burgers requires precise ingredient combinations of Violet Corn+Tomato+3 Bone Blossoms."
          }
        },
        {
          "@type": "Question",
          "name": "How do I optimize GAG cooking time efficiency?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Efficient GAG cooking requires proper planning. Prepare ingredients for multiple dishes simultaneously, utilizing different cooking times for combinations. For example, while making 10-minute burgers, you can prepare 5-minute salad ingredients to maximize time utilization."
          }
        },
        {
          "@type": "Question",
          "name": "Which dishes should I prioritize in GAG game?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We recommend prioritizing burgers, pizza and cakes - these three core GAG recipes. They not only have high value in the game but also offer rich rarity variants, making them the best choice for improving cooking skills."
          }
        },
        {
          "@type": "Question",
          "name": "How do I obtain rare ingredients for Prismatic-level dishes?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Rare ingredient acquisition is a core challenge in GAG game. Bone Blossoms are usually obtained through special planting or trading, Violet Corn requires upgrading regular corn, and Beanstalks need completing specific tasks. Participate in game activities and exchange ingredient acquisition experiences with other players."
          }
        }
      ]
    };
    
    this.addJSONLD(faqData);
  }
  
  addJSONLD(data) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }
}

// ==================== Application Initialization ====================
class RecipeApp {
  constructor() {
    this.dataManager = new DataManager();
    this.renderManager = new RenderManager(this.dataManager);
    this.interactionManager = new InteractionManager(this.dataManager, this.renderManager);
    this.seoManager = new SEOManager(this.dataManager);
  }
  
  async init() {
    try {
      // Show loading state
      this.showLoadingState();
      
      // Load data
      await this.dataManager.loadRecipes();
      
      // Render content
      this.renderManager.renderKPI();
      this.renderManager.renderRecipeCards(this.dataManager.getRecipes());
      this.renderManager.renderRecipeDetails(this.dataManager.getRecipes());
      
      // Initialize interactions
      this.interactionManager.init();
      
      // SEO optimization
      this.seoManager.injectStructuredData();
      
      // Hide loading state
      this.hideLoadingState();
      
      console.log('GAG Recipe App initialization completed');
    } catch (error) {
      this.showErrorState(error.message);
      console.error('Application initialization failed:', error);
    }
  }
  
  showLoadingState() {
    // Loading state already set in HTML
  }
  
  hideLoadingState() {
    // Remove loading indicator
    DOM.$$('.loading').forEach(element => {
      element.remove();
    });
  }
  
  showErrorState(message) {
    const recipesContainer = DOM.$('#recipes');
    const detailsContainer = DOM.$('#detailsBody');
    
    const errorHTML = `
      <div class="empty-state">
        <h3>Loading Failed</h3>
        <p>${message}</p>
        <button class="btn primary" onclick="location.reload()">Reload</button>
      </div>
    `;
    
    if (recipesContainer) recipesContainer.innerHTML = errorHTML;
    if (detailsContainer) detailsContainer.innerHTML = errorHTML;
  }
}

// ==================== Application Startup ====================
document.addEventListener('DOMContentLoaded', () => {
  const app = new RecipeApp();
  app.init();
});

// Add enhanced CSS animations and effects
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeInUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .recipe-card {
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
  }
  
  .recipe-card:nth-child(1) { animation-delay: 0.1s; }
  .recipe-card:nth-child(2) { animation-delay: 0.2s; }
  .recipe-card:nth-child(3) { animation-delay: 0.3s; }
  .recipe-card:nth-child(4) { animation-delay: 0.4s; }
  .recipe-card:nth-child(5) { animation-delay: 0.5s; }
  .recipe-card:nth-child(6) { animation-delay: 0.6s; }
  
  .kpi-card {
    animation: scaleIn 0.5s ease-out;
    animation-fill-mode: both;
  }
  
  .kpi-card:nth-child(1) { animation-delay: 0.2s; }
  .kpi-card:nth-child(2) { animation-delay: 0.4s; }
  .kpi-card:nth-child(3) { animation-delay: 0.6s; }
  
  .loading {
    animation: pulse 2s infinite;
    background: linear-gradient(
      90deg,
      var(--color-bg-secondary) 25%,
      var(--color-border-primary) 50%,
      var(--color-bg-secondary) 75%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .hero-title {
    animation: fadeInUp 0.8s ease-out;
  }
  
  .hero-subtitle {
    animation: fadeInUp 0.8s ease-out 0.2s;
    animation-fill-mode: both;
    opacity: 0;
  }
  
  .toolbar {
    animation: fadeInUp 0.6s ease-out 0.4s;
    animation-fill-mode: both;
    opacity: 0;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .recipe-card,
    .kpi-card,
    .hero-title,
    .hero-subtitle,
    .toolbar {
      animation: none !important;
      opacity: 1 !important;
    }
  }
`;
document.head.appendChild(style);
