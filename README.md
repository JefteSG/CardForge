# CardForge - AI-Powered Card Creation Platform

## 🎯 Visão Geral

CardForge é uma aplicação web MVP inovadora para criação de cartas de jogo personalizáveis com geração de imagens via IA. Desenvolvida como um protótipo funcional, a plataforma permite criar cartas customizadas com diferentes raridades, tipos e variantes, incluindo sistema de exportação em múltiplos formatos.

### ✨ Características Principais

- **🤖 Geração de Imagens IA**: Integração com OpenAI DALL-E para criação de artwork personalizado
- **⚡ Desenvolvimento Rápido**: Interface intuitiva para criar uma carta em menos de 2 minutos
- **🎨 Sistema de Raridades**: 5 níveis de raridade (comum a mítico) com cores distintivas
- **🔧 Tipos Versáteis**: Criaturas, feitiços, artefatos e encantamentos
- **✨ Variantes Especiais**: Normal, brilhante, holográfica e primeira edição
- **📊 Analytics**: Estatísticas em tempo real da coleção
- **📁 Sistema de Exportação**: PNG, PDF e JSON formats
- **💾 Persistência Local**: SQLite no navegador para funcionamento offline-first
  

  
## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Framework UI moderno
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Sistema de design responsivo
- **shadcn/ui** - Componentes UI consistentes
- **Lucide React** - Ícones modernos
- **Sonner** - Sistema de notificações
- **Motion** - Animações fluidas

### Backend & Persistência
- **SQLite** - Banco de dados local (browser + servidor)
- **sql.js** - SQLite compilado para WebAssembly
- **Hono** - Framework web rápido para API local
- **Vite** - Build tool e dev server
- **LocalStorage** - Persistência no navegador

### Integração IA
- **OpenAI DALL-E 3** - Geração de imagens (opcional)
- **Unsplash API** - Fallback de imagens
- **Stability AI** - Suporte futuro (preparado)

## 🚀 Arquitetura do Sistema

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Local API     │    │   SQLite DB     │
│   (React)       │◄──►│   (Hono/Vite)   │◄──►│   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   File Storage  │    │   LocalStorage  │
│   (OpenAI)      │    │   (ObjectURL)   │    │   (Backup)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## 📁 Estrutura do Projeto

\`\`\`
CardForge/
├── src/
│   ├── App.tsx                    # Componente principal com roteamento
│   ├── components/
│   │   ├── AIImageGenerator.tsx   # Geração e upload de imagens
│   │   ├── CardBuilder.tsx        # Interface de criação/edição
│   │   ├── CardGallery.tsx        # Visualização de coleção
│   │   ├── CardPreview.tsx        # Preview das cartas
│   │   ├── ExportDialog.tsx       # Sistema de exportação
│   │   └── ui/                    # Componentes shadcn/ui
│   ├── services/
│   │   ├── sqlite-db.ts           # Cliente SQLite browser
│   │   ├── sqlite-adapter.ts      # Adaptador de API
│   │   └── api.ts                 # Cliente API REST
│   ├── server/
│   │   ├── db.ts                  # SQLite servidor
│   │   └── local-api.ts           # API Hono local
│   └── config/
│       └── constants.js           # Configurações de raridade/tipos
├── data/
│   └── cardforge.db              # Arquivo SQLite (servidor)
├── public/
│   └── sql-wasm.wasm             # WebAssembly SQLite
├── vite.config.ts                # Configuração Vite + Hono
└── package.json                  # Dependências
\`\`\`

## 🔧 Funcionalidades Implementadas

### ✅ Sprint 1 - MVP Frontend (Concluída)
- [x] Interface de criação de cartas responsiva
- [x] Sistema de preview em tempo real
- [x] Galeria com filtros e busca
- [x] Mock de geração de imagens com Unsplash
- [x] Sistema de constantes configuráveis
- [x] Componentes reutilizáveis

### ✅ Sprint 2 - Backend & IA (Concluída)
- [x] API REST completa (CRUD de cartas)
- [x] Integração SQLite para persistência local
- [x] Sistema de upload de imagens
- [x] Integração OpenAI DALL-E real (opcional)
- [x] Endpoints de estatísticas
- [x] Sistema de exportação
- [x] Tratamento de erros robusto

### 🎯 Funcionalidades do MVP

#### 🎨 Editor de Cartas
- Campos editáveis: título, descrição, tipo, raridade, coleção
- Seleção de variante (normal, brilhante, holográfica)
- Preview em tempo real das mudanças
- Validação de campos obrigatórios

#### 🤖 Geração de Imagens IA
- Prompts otimizados por tipo de carta
- Geração via OpenAI DALL-E 3 (opcional)
- Upload de imagens customizadas
- Fallback automático para Unsplash
- Validação de formato e tamanho

#### 📊 Galeria & Analytics
- Visualização em grid responsiva
- Filtros por raridade, tipo e coleção
- Busca textual em tempo real
- Ordenação múltipla (data, nome, raridade)
- Estatísticas da coleção

#### 💾 Persistência & Exportação
- Salvamento automático no SQLite local
- Sistema offline-first (funciona sem internet)
- Exportação em JSON, PNG e PDF
- Backup automático no LocalStorage

## 🛣️ Roadmap (Pausado)

O roadmap está pausado temporariamente. Manteremos apenas manutenção e o backend em SQLite no navegador.

### 🎮 Sprint 3 - Recursos Avançados (Pausado)
- [ ] Templates de cartas personalizáveis
- [ ] Editor de layout drag-and-drop
- [ ] Sistema de tags e categorização

### 🔧 Sprint 4 - Otimização & Produção (Pausado)
- [ ] Performance optimization
- [ ] CDN para imagens
- [ ] Testes automatizados

## 📋 Configuração e Instalação

### Pré-requisitos
- Node.js 18+
- Navegador moderno com suporte a WebAssembly
- Chave API OpenAI (opcional)

### 🚀 Quick Start

1. **Clone o repositório**
\`\`\`bash
git clone https://github.com/your-username/cardforge.git
cd cardforge
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm install
\`\`\`

3. **Configure variáveis de ambiente (opcional)**
\`\`\`bash
# Crie um arquivo .env.local
OPENAI_API_KEY=sua_chave_openai  # Opcional para IA
\`\`\`

4. **Execute a aplicação**
\`\`\`bash
npm run dev
\`\`\`

A aplicação estará disponível em `http://localhost:3000`

### 🏗️ Desenvolvimento Local

\`\`\`bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
\`\`\`

## 🎨 Design System

### Cores e Raridades
\`\`\`javascript
const RARITIES = {
  common: { name: 'Common', color: '#9CA3AF' },
  rare: { name: 'Rare', color: '#3B82F6' },
  epic: { name: 'Epic', color: '#8B5CF6' },
  legendary: { name: 'Legendary', color: '#F59E0B' },
  mythic: { name: 'Mythic', color: '#EF4444' }
};
\`\`\`

### Componentes UI
- Baseado em shadcn/ui para consistência
- Tailwind v4 para styling moderno
- Design responsivo mobile-first
- Dark/light mode support

## 📊 Métricas e Performance

### Objetivos de Performance
- ⚡ Tempo de carregamento < 2s
- 🎯 Criação de carta < 2 minutos
- 📱 Score mobile > 90
- ♿ Acessibilidade WCAG AA

### Analytics Implementadas
- Total de cartas criadas
- Distribuição por raridade/tipo
- Atividade recente dos usuários
- Tempo médio de criação

## 💾 Sistema de Persistência SQLite

### Arquitetura Dual
- **Browser**: SQLite via WebAssembly + LocalStorage backup
- **Servidor**: SQLite nativo com arquivo em `data/cardforge.db`

### Schema do Banco
\`\`\`sql
CREATE TABLE cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  rarity TEXT,
  type TEXT,
  collection TEXT,
  imageUrl TEXT,
  imagePrompt TEXT,
  variant TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
\`\`\`

### Funcionalidades
- ✅ Funcionamento offline completo
- ✅ Sincronização automática
- ✅ Backup em LocalStorage
- ✅ Persistência entre sessões
- ✅ Performance otimizada

## 🐛 Debugging e Troubleshooting

### Problemas Comuns

1. **Site não carrega**
   - ✅ Solucionado: Implementado modo offline-first
   - Aplicação funciona mesmo sem backend
   - Retry automático de conexão

2. **Imagens IA não geram**
   - Verificar OPENAI_API_KEY configurada
   - Fallback automático para Unsplash
   - Logs detalhados no console

3. **Dados não salvam**
   - Modo offline salva localmente
   - Backup automático no LocalStorage
   - Indicador visual de status

### Logs e Monitoramento
\`\`\`javascript
// Logs estruturados implementados
console.log('API Error:', { endpoint, status, error });
console.log('Card Created:', { id, title, type });
console.log('SQLite Status:', { browser: true, server: false });
\`\`\`

## 🤝 Contribuição

### Como Contribuir
1. Fork do repositório
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Guidelines de Código
- TypeScript para tipagem estática
- ESLint e Prettier configurados
- Testes unitários obrigatórios
- Documentação JSDoc

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🙋 Suporte e Contato

- 📧 Email: suporte@cardforge.app
- 💬 Discord: [CardForge Community](https://discord.gg/cardforge)
- 📚 Documentação: [docs.cardforge.app](https://docs.cardforge.app)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/cardforge/issues)

## 🎉 Agradecimentos

- **sql.js** - SQLite compilado para WebAssembly
- **OpenAI** - Pela API DALL-E incrível
- **shadcn/ui** - Componentes UI de qualidade
- **Comunidade React** - Pelo ecossistema incrível

---

<div align="center">

**🚀 CardForge - Criando o futuro dos jogos de cartas com IA 🤖**

[![Versão](https://img.shields.io/badge/versão-2.0.0-blue.svg)](https://github.com/your-username/cardforge)
[![Status](https://img.shields.io/badge/status-MVP_Completo-green.svg)](https://github.com/your-username/cardforge)
[![Licença](https://img.shields.io/badge/licença-MIT-blue.svg)](LICENSE)

</div>

---

*Última atualização: Janeiro 2025 | Roadmap pausado | Modo SQLite-only ativo*
