import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type FormEvent,
  type ReactNode,
} from "react"
import mascotImage from "./assets/money-buddy-mascot.jpg"
import AccessibilityFeedback, {
  ImageZoom,
  ReadingText,
  useDialogFocus,
  useFeedback,
} from "./Accessibility"

declare global {
  interface Window {
    VLibras?: {
      Widget: new (
        url: string,
      ) => void
    }
  }
}

type IconName = "home" | "wallet" | "chart" | "calendar" | "learn" | "shield" | "settings" | "help" | "bell" | "eye" | "plus" | "arrow" | "trend" | "food" | "homeExpense" | "transport" | "health" | "tax" | "lock" | "audio" | "hands" | "check" | "menu" | "close"

type FontScale = "Padrão" | "Grande" | "Muito grande"
type ContrastLevel = "Padrão" | "Alto contraste"

type AccessibilityPreferences = {
  fontScale: FontScale
  contrast: ContrastLevel
  audio: boolean
  libras: boolean
  reduceMotion: boolean
  largeControls: boolean
  fontFamily: "Manrope" | "Arial" | "Georgia"
  lineHeight: "Padrão" | "Confortável" | "Amplo"
  pageZoom: number
  theme: "Claro" | "Escuro" | "Alto contraste" | "Personalizado"
  background: string
  foreground: string
  inverted: boolean
  highlight: string
  sound: boolean
  vibration: boolean
  shortcuts: boolean
}

type InfoModalContent = {
  eyebrow: string
  title: string
  description: string
  icon: IconName
  highlights: string[]
  note?: string
}

const defaultPreferences: AccessibilityPreferences = {
  fontScale: "Padrão",
  contrast: "Padrão",
  audio: false,
  libras: false,
  reduceMotion: false,
  largeControls: false,
  fontFamily: "Manrope",
  lineHeight: "Padrão",
  pageZoom: 100,
  theme: "Claro",
  background: "#f7f8f4",
  foreground: "#252c3f",
  inverted: false,
  highlight: "Dourado",
  sound: false,
  vibration: false,
  shortcuts: true,
}

function contrastRatio(background: string, foreground: string) {
  const luminance = (hex: string) => {
    const rgb = hex
      .match(/[a-f\d]{2}/gi)!
      .map((channel) => parseInt(channel, 16) / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
  }
  const first = luminance(background)
  const second = luminance(foreground)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

function ReadingPreferences({
  preferences: p,
  updatePreference: update,
}: {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences,>(
    key: K,
    value: AccessibilityPreferences[K],
  ) => void
}) {
  const ratio = contrastRatio(p.background, p.foreground)
  return (
    <section
      className="rounded-card border border-line bg-white p-5 shadow-card"
      aria-labelledby="reading-settings"
    >
      <h2 id="reading-settings" className="font-extrabold">
        Leitura, cores e autonomia
      </h2>
      <p className="mt-1 text-xs text-muted">
        Ajustes imediatos, sem alterar seus dados financeiros.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-bold">
          Tipo da fonte
          <select
            className="a11y-select"
            value={p.fontFamily}
            onChange={(e) =>
              update(
                "fontFamily",
                e.target.value as AccessibilityPreferences["fontFamily"],
              )
            }
          >
            <option value="Manrope">Manrope · padrão</option>
            <option value="Arial">Arial · sem serifa</option>
            <option value="Georgia">Georgia · com serifa</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Espaçamento entre linhas
          <select
            className="a11y-select"
            value={p.lineHeight}
            onChange={(e) =>
              update(
                "lineHeight",
                e.target.value as AccessibilityPreferences["lineHeight"],
              )
            }
          >
            <option>Padrão</option>
            <option>Confortável</option>
            <option>Amplo</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Tema de cores
          <select
            className="a11y-select"
            value={p.theme}
            onChange={(e) =>
              update(
                "theme",
                e.target.value as AccessibilityPreferences["theme"],
              )
            }
          >
            <option>Claro</option>
            <option>Escuro</option>
            <option>Alto contraste</option>
            <option>Personalizado</option>
          </select>
        </label>
        <label className="text-sm font-bold">
          Cor do marca-texto
          <select
            className="a11y-select"
            value={p.highlight}
            onChange={(e) => update("highlight", e.target.value)}
          >
            <option>Dourado</option>
            <option>Verde</option>
            <option>Azul</option>
          </select>
        </label>
      </div>
      {p.theme === "Personalizado" && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm font-bold">
              Fundo{" "}
              <input
                type="color"
                value={p.background}
                onChange={(e) => update("background", e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-bold">
              Texto{" "}
              <input
                type="color"
                value={p.foreground}
                onChange={(e) => update("foreground", e.target.value)}
              />
            </label>
          </div>
          <p className="mt-3 text-xs" role="status">
            {ratio >= 4.5
              ? `Contraste ${ratio.toFixed(1)}:1 — cores aplicadas.`
              : `Contraste ${ratio.toFixed(1)}:1 — escolha cores com pelo menos 4,5:1. Mantemos cores seguras até lá.`}
          </p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">Redimensionar página</p>
        <div
          className="flex items-center gap-3"
          role="group"
          aria-label="Redimensionar página"
        >
          <button
            className="a11y-control"
            aria-label="Reduzir página"
            disabled={p.pageZoom <= 100}
            onClick={() => update("pageZoom", p.pageZoom - 25)}
          >
            −
          </button>
          <output aria-live="polite">{p.pageZoom}%</output>
          <button
            className="a11y-control"
            aria-label="Ampliar página"
            disabled={p.pageZoom >= 200}
            onClick={() => update("pageZoom", p.pageZoom + 25)}
          >
            +
          </button>
          <button
            className="a11y-control"
            onClick={() => update("pageZoom", 100)}
          >
            100%
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-4 border-t border-line pt-4">
        {([
          ["inverted", "Inverter fundo e texto"],
          ["sound", "Sons de confirmação e erro"],
          ["vibration", "Vibração de confirmação e erro"],
          ["shortcuts", "Atalhos de teclado"],
        ] as const).map(([key, label]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 text-sm font-bold"
          >
            <span>{label}</span>
            <Toggle
              on={p[key]}
              label={label}
              setOn={(value) => update(key, value)}
            />
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Sons e vibração são opcionais e dependem do dispositivo e das permissões
        do navegador. A mensagem escrita e o anúncio para leitores de tela
        permanecem disponíveis.
      </p>
      <details className="mt-4 rounded-xl bg-surface p-4 text-sm">
        <summary className="cursor-pointer font-bold">
          Consultar atalhos de teclado
        </summary>
        <p className="mt-2">
          Alt + Shift + 1 a 6: seções do menu, na ordem. Alt + Shift + A:
          configurações. Alt + Shift + N: novo gasto. Escape: fechar janela.
        </p>
        <p className="mt-2 text-muted">
          Os atalhos de navegação não atuam durante a digitação nem em janelas
          abertas. Você pode desativá-los acima. Alguns sistemas podem reservar
          essas combinações.
        </p>
      </details>
      <p className="mt-4 text-xs text-muted">
        Abra um card de estudo ou uma obrigação fiscal para destacar e remover
        destaques por trecho.
      </p>
    </section>
  )
}

const fiscalDetails: Record<string, InfoModalContent> = {
  "Carnê-Leão — setembro": {
    eyebrow: "VENCE EM 30 DE OUTUBRO DE 2026",
    title: "Carnê-Leão de setembro",
    description:
      "É a apuração mensal do imposto de renda para quem recebeu valores de pessoas físicas ou do exterior, como aluguel, pensão ou trabalho autônomo.",
    icon: "tax",
    highlights: [
      "Registre no Carnê-Leão Web os rendimentos recebidos em setembro.",
      "Desconte despesas permitidas e confira se existe imposto a pagar.",
      "Se houver imposto, emita o DARF e pague até o último dia útil de outubro.",
    ],
    note: "Essa obrigação só se aplica a quem recebeu rendimentos sujeitos ao Carnê-Leão no período.",
  },
  "DAS — MEI outubro": {
    eyebrow: "VENCE EM 20 DE NOVEMBRO DE 2026",
    title: "DAS mensal do MEI",
    description:
      "O Documento de Arrecadação do Simples Nacional reúne a contribuição previdenciária e os tributos fixos do microempreendedor individual.",
    icon: "calendar",
    highlights: [
      "A guia corresponde à competência de outubro de 2026.",
      "Ela pode ser emitida pelo Portal do Simples Nacional ou pelo app MEI.",
      "O pagamento em dia ajuda a manter os benefícios previdenciários e a regularidade do CNPJ.",
    ],
    note: "O DAS é devido mensalmente pelo MEI, inclusive quando não houve faturamento.",
  },
  "DASN-SIMEI 2027": {
    eyebrow: "PRAZO REGULAR ATÉ 31 DE MAIO DE 2027",
    title: "Declaração anual do MEI",
    description:
      "A DASN-SIMEI informa à Receita Federal o faturamento bruto do MEI no ano-calendário de 2026 e se houve empregado contratado.",
    icon: "tax",
    highlights: [
      "Some todas as receitas brutas recebidas durante 2026.",
      "Separe quanto veio de comércio, indústria e prestação de serviços.",
      "Envie a declaração mesmo que o negócio não tenha faturado no ano.",
    ],
    note: "O prazo regular da DASN-SIMEI termina no último dia de maio do ano seguinte.",
  },
}

const learningCard: InfoModalContent = {
  eyebrow: "CARD DO DIA • LEITURA DE 3 MINUTOS",
  title: "Reserva de emergência: por onde começar?",
  description:
    "A reserva de emergência é um dinheiro separado para imprevistos, como uma despesa médica, um conserto urgente ou a perda temporária de renda.",
  icon: "shield",
  highlights: [
    "Comece com uma meta pequena, como guardar o equivalente a uma semana de despesas essenciais.",
    "Automatize um valor possível todo mês — consistência importa mais que começar com muito.",
    "Prefira um lugar seguro, com liquidez diária e fácil acesso, sem misturar com a conta do dia a dia.",
    "Depois da primeira meta, avance gradualmente até cobrir de 3 a 6 meses dos seus gastos essenciais.",
  ],
  note: "Seu primeiro passo hoje: escolha um valor realista para separar assim que receber sua próxima renda.",
}

const learningDetails: Record<string, InfoModalContent> = {
  "Reserva de emergência": learningCard,
  "Como declarar renda extra": {
    eyebrow: "EDUCAÇÃO FISCAL",
    title: "Como declarar renda extra",
    description:
      "A forma de declarar depende da origem e do tipo de renda. Organizar os comprovantes é o primeiro passo.",
    icon: "tax",
    highlights: [
      "Separe os comprovantes de cada fonte de renda e identifique quem fez os pagamentos.",
      "Rendimentos de pessoas físicas ou do exterior podem exigir apuração mensal pelo Carnê-Leão.",
      "Consulte as regras vigentes da Receita Federal para verificar se precisa entregar a declaração anual.",
    ],
    note: "Conteúdo educativo: não substitui orientação contábil individual.",
  },
  "CDB, Tesouro ou poupança?": {
    eyebrow: "EDUCAÇÃO FINANCEIRA",
    title: "CDB, Tesouro ou poupança?",
    description:
      "Antes de comparar rendimentos, pense em quando precisará do dinheiro e quais riscos pode assumir.",
    icon: "trend",
    highlights: [
      "Compare liquidez, impostos, taxas e riscos, além da rentabilidade anunciada.",
      "CDBs variam conforme o emissor e o prazo. Confira as condições de resgate e os limites de cobertura do FGC.",
      "Títulos do Tesouro podem oscilar antes do vencimento. A poupança tem regras próprias de remuneração e aniversário.",
    ],
    note: "Conteúdo educativo, não é uma recomendação de investimento.",
  },
}

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 6.5h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h12" />
      <path d="M16 12h6v4h-6a2 2 0 0 1 0-4Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  learn: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.3.9-1.3 1.7v.5" />
      <path d="M12 17h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </>
  ),
  trend: (
    <>
      <path d="m3 17 6-6 4 4 8-9" />
      <path d="M15 6h6v6" />
    </>
  ),
  food: (
    <>
      <path d="M6 2v8M3 2v5a3 3 0 0 0 6 0V2M6 10v12M16 2v20M16 2c3 2 4 5 4 9h-4" />
    </>
  ),
  homeExpense: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),
  transport: (
    <>
      <path d="M5 17h14l-1.5-6h-11L5 17Z" />
      <path d="M7 11 9 6h6l2 5M7 17v2M17 17v2" />
      <circle cx="8" cy="15" r=".5" />
      <circle cx="16" cy="15" r=".5" />
    </>
  ),
  health: (
    <>
      <path d="M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 16.5 12 21 12 21Z" />
      <path d="M8 12h2l1-2 2 4 1-2h2" />
    </>
  ),
  tax: (
    <>
      <path d="M5 3h14v18H5z" />
      <path d="M8 7h8M8 11h8M8 15h3" />
      <path d="m14 17 1.5 1.5L18 16" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  audio: (
    <>
      <path d="M5 9H2v6h3l5 4V5L5 9Z" />
      <path d="M14 9a4 4 0 0 1 0 6M17 6a8 8 0 0 1 0 12" />
    </>
  ),
  hands: (
    <>
      <path d="M8 13V5a2 2 0 0 1 4 0v6M12 11V3a2 2 0 0 1 4 0v9M16 12V6a2 2 0 0 1 4 0v9c0 4-3 7-7 7h-2c-3 0-5-2-6-5l-2-5a2 2 0 0 1 3-2l2 3Z" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
}

function Icon({ name, size = "size-5" }: {
  name: IconName
  size?: string
}) {
  return (
    <svg
      className={size}
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`cursor-pointer outline-none transition focus-visible:ring-4 focus-visible:ring-focus ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

const navItems: {
  label: string
  icon: IconName
}[] = [
  { label: "Visão geral", icon: "home" },
  { label: "Minha carteira", icon: "wallet" },
  { label: "Gastos", icon: "chart" },
  { label: "Calendário fiscal", icon: "calendar" },
  { label: "Aprender", icon: "learn" },
  { label: "Privacidade", icon: "shield" },
]

type ExpenseRecord = {
  id: number
  description: string
  category: string
  amount: number
  date: string
}

const expenseCategories = [
  {
    label: "Moradia",
    icon: "homeExpense" as IconName,
    tone: "bg-orange-soft text-orange",
    budget: 1500,
  },
  {
    label: "Alimentação",
    icon: "food" as IconName,
    tone: "bg-violet-soft text-violet",
    budget: 900,
  },
  {
    label: "Transporte",
    icon: "transport" as IconName,
    tone: "bg-blue-soft text-blue",
    budget: 600,
  },
  {
    label: "Saúde e bem-estar",
    icon: "health" as IconName,
    tone: "bg-green-soft text-green",
    budget: 450,
  },
  {
    label: "Lazer e outros",
    icon: "learn" as IconName,
    tone: "bg-coral-soft text-coral",
    budget: 550,
  },
]

const initialCategoryTotals: Record<string, number> = {
  Moradia: 1280,
  Alimentação: 742,
  Transporte: 463,
  "Saúde e bem-estar": 318,
  "Lazer e outros": 343.8,
}

const initialExpenseRecords: ExpenseRecord[] = [
  {
    id: 1,
    description: "Supermercado Central",
    category: "Alimentação",
    amount: 186.4,
    date: "Hoje, 08:32",
  },
  {
    id: 2,
    description: "Plano de internet",
    category: "Moradia",
    amount: 119.9,
    date: "Ontem, 18:10",
  },
  {
    id: 3,
    description: "Aplicativo de transporte",
    category: "Transporte",
    amount: 34.5,
    date: "27 out, 22:14",
  },
  {
    id: 4,
    description: "Farmácia",
    category: "Saúde e bem-estar",
    amount: 72.8,
    date: "26 out, 13:45",
  },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)

const getProgressWidth = (percentage: number) => {
  if (percentage >= 90) return "w-full"
  if (percentage >= 75) return "w-4/5"
  if (percentage >= 60) return "w-2/3"
  if (percentage >= 45) return "w-1/2"
  if (percentage >= 30) return "w-1/3"
  return "w-1/5"
}

function Sidebar({
  open,
  close,
  active,
  setActive,
  openAccessibility,
}: {
  open: boolean
  close: () => void
  active: string
  setActive: (item: string) => void
  openAccessibility: () => void
}) {
  const [desktop, setDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  )
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)")
    const update = () => setDesktop(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  return (
    <aside
      inert={!desktop && !open}
      className={`${
        open ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white p-5 transition-transform lg:static lg:w-64 lg:translate-x-0`}
    >
      <div className="flex items-center justify-between px-2 pb-9 pt-2">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-brand">
            <Icon name="trend" />
          </div>
          <div>
            <p className="text-xl font-extrabold tracking-tight">
              <span className="text-primary">Money</span>{" "}
              <span className="text-yellow-dark">Buddy</span>
            </p>
            <p className="text-xs font-semibold tracking-wide text-muted">
              SEU PARCEIRO FINANCEIRO
            </p>
          </div>
        </div>
        <Button
          aria-label="Fechar menu"
          onClick={close}
          className="rounded-lg p-2 text-muted hover:bg-surface lg:hidden"
        >
          <Icon name="close" />
        </Button>
      </div>
      <nav aria-label="Navegação principal" className="flex-1 space-y-1.5">
        {navItems.map((item) => (
          <Button
            key={item.label}
            onClick={() => {
              setActive(item.label)
              close()
            }}
            aria-current={active === item.label ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              active === item.label
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            <Icon name={item.icon} />
            {item.label}
          </Button>
        ))}
      </nav>
      <div className="border-t border-line pt-4">
        <Button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink">
          <Icon name="help" /> Central de ajuda
        </Button>
        <Button
          onClick={openAccessibility}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"
        >
          <Icon name="settings" /> Configurações
        </Button>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-surface p-3">
          <div className="grid size-10 place-items-center rounded-full bg-avatar text-sm font-bold text-primary">
            LM
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink">Lucas Martins</p>
            <p className="truncate text-xs text-muted">Plano Essencial</p>
          </div>
          <Icon name="arrow" size="size-4" />
        </div>
      </div>
    </aside>
  )
}

function Toggle({
  on,
  setOn,
  label,
}: {
  on: boolean
  setOn: (value: boolean) => void
  label: string
}) {
  return (
    <Button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => setOn(!on)}
      className={`relative h-6 w-11 rounded-full p-0.5 ${
        on ? "bg-primary" : "bg-disabled"
      }`}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </Button>
  )
}

function ChoiceButton({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-line bg-white text-muted hover:border-primary/40 hover:text-ink"
      }`}
    >
      {selected && <Icon name="check" size="size-4" />}
      {children}
    </Button>
  )
}

function AccessibilityWelcome({
  preferences,
  updatePreference,
  onContinue,
  onReset,
  onZoomImage,
}: {
  preferences: AccessibilityPreferences
  updatePreference: <Key extends keyof AccessibilityPreferences,>(
    key: Key,
    value: AccessibilityPreferences[Key],
  ) => void
  onContinue: () => void
  onReset: () => void
  onZoomImage: () => void
}) {
  const enabledCount = [
    preferences.fontScale !== "Padrão",
    preferences.contrast !== "Padrão",
    preferences.audio,
    preferences.libras,
    preferences.reduceMotion,
    preferences.largeControls,
    preferences.fontFamily !== "Manrope",
    preferences.lineHeight !== "Padrão",
    preferences.pageZoom !== 100,
    preferences.theme !== "Claro",
    preferences.inverted,
    preferences.sound,
    preferences.vibration,
    !preferences.shortcuts,
  ].filter(Boolean).length

  return (
    <main className="welcome-shell min-h-screen bg-canvas text-ink">
      <div className="mx-auto grid min-h-screen max-w-screen-2xl lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative flex min-h-96 overflow-hidden bg-hero p-7 text-white md:p-12 lg:min-h-screen lg:p-14">
          <div className="absolute -left-24 -top-24 size-80 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-white/5" />
          <div className="relative z-10 flex w-full flex-col">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary text-white shadow-brand">
                <Icon name="trend" />
              </div>
              <div>
                <p className="text-xl font-extrabold tracking-tight">
                  <span className="text-white">Money</span>{" "}
                  <span className="text-yellow">Buddy</span>
                </p>
                <p className="text-xs font-semibold tracking-wide text-white/55">
                  SEU PARCEIRO FINANCEIRO
                </p>
              </div>
            </div>

            <div className="mt-10 max-w-xl lg:mt-auto">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-mint">
                <Icon name="settings" size="size-4" />
                EXPERIÊNCIA DO SEU JEITO
              </span>
              <p className="mt-5 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Boas-vindas! Vamos deixar tudo mais confortável?
              </p>
              <p className="mt-4 max-w-lg leading-relaxed text-white/70">
                Ajuste a experiência de acordo com suas necessidades. Você
                poderá mudar essas escolhas quando quiser.
              </p>
            </div>

            <div className="relative mt-8 overflow-hidden rounded-card border border-white/10 bg-white/5 lg:mt-10">
              <img
                className="welcome-mascot h-52 w-full object-cover md:h-64"
                src={mascotImage}
                alt="Mascote capivara do Money Buddy em uma paisagem tranquila"
              />
              <div className="relative bg-hero p-5">
                <p className="font-bold text-white">
                  O Buddy está aqui para acompanhar você.
                </p>
                <p className="mt-1 text-sm text-white/70">
                  Sem pressa, sem julgamentos e com mais autonomia.
                </p>
                <Button
                  onClick={onZoomImage}
                  aria-haspopup="dialog"
                  className="mt-3 rounded-xl border border-white px-3 py-2 text-sm font-bold"
                >
                  Ampliar imagem do Buddy
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          className="flex items-center p-5 md:p-10 lg:p-12"
          aria-labelledby="accessibility-title"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold tracking-widest text-primary">
                  ANTES DE COMEÇAR
                </p>
                <h1
                  id="accessibility-title"
                  tabIndex={-1}
                  className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl"
                >
                  Como podemos facilitar seu acesso?
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Selecione quantas opções quiser. As mudanças aparecem
                  imediatamente.
                </p>
              </div>
              <span className="rounded-full bg-green-soft px-3 py-1.5 text-xs font-bold text-green">
                {enabledCount === 0
                  ? "Configuração padrão"
                  : `${enabledCount} ${
                      enabledCount === 1 ? "ajuste ativo" : "ajustes ativos"
                    }`}
              </span>
            </div>

            <div className="mt-7 space-y-4">
              <div className="rounded-card border border-line bg-white p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon name="eye" />
                  </span>
                  <div>
                    <p className="font-extrabold">Conforto visual</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Tamanho dos textos e contraste das cores
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <p className="text-xs font-bold text-muted">
                    TAMANHO DA FONTE
                  </p>
                  <div
                    className="mt-2 grid gap-2 sm:grid-cols-3"
                    role="group"
                    aria-label="Tamanho da fonte"
                  >
                    {(["Padrão", "Grande", "Muito grande"] as FontScale[]).map(
                      (option) => (
                        <ChoiceButton
                          key={option}
                          selected={preferences.fontScale === option}
                          onClick={() => updatePreference("fontScale", option)}
                        >
                          {option}
                        </ChoiceButton>
                      ),
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-muted">CONTRASTE</p>
                  <div
                    className="mt-2 grid gap-2 sm:grid-cols-2"
                    role="group"
                    aria-label="Nível de contraste"
                  >
                    {(["Padrão", "Alto contraste"] as ContrastLevel[]).map(
                      (option) => (
                        <ChoiceButton
                          key={option}
                          selected={preferences.contrast === option}
                          onClick={() => updatePreference("contrast", option)}
                        >
                          {option}
                        </ChoiceButton>
                      ),
                    )}
                  </div>
                </div>
              </div>

              <ReadingPreferences
                preferences={preferences}
                updatePreference={updatePreference}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-line bg-white p-5 shadow-card">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-soft text-blue">
                      <Icon name="audio" />
                    </span>
                    <div>
                      <p className="font-extrabold">Apoio auditivo</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Conteúdo em formatos alternativos
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 divide-y divide-line">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-bold">Audiodescrição</p>
                        <p className="text-xs text-muted">Narrar a interface</p>
                      </div>
                      <Toggle
                        on={preferences.audio}
                        setOn={(value) => updatePreference("audio", value)}
                        label="Ativar audiodescrição"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-bold">Janela de Libras</p>
                        <p className="text-xs text-muted">Intérprete virtual</p>
                      </div>
                      <Toggle
                        on={preferences.libras}
                        setOn={(value) => updatePreference("libras", value)}
                        label="Ativar janela de Libras"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-card border border-line bg-white p-5 shadow-card">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-soft text-orange">
                      <Icon name="hands" />
                    </span>
                    <div>
                      <p className="font-extrabold">Conforto motor</p>
                      <p className="mt-0.5 text-xs text-muted">
                        Menos movimento e alvos maiores
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 divide-y divide-line">
                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-bold">Reduzir animações</p>
                        <p className="text-xs text-muted">
                          Transições mais discretas
                        </p>
                      </div>
                      <Toggle
                        on={preferences.reduceMotion}
                        setOn={(value) =>
                          updatePreference("reduceMotion", value)
                        }
                        label="Reduzir animações"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="text-sm font-bold">Controles maiores</p>
                        <p className="text-xs text-muted">
                          Mais área para tocar
                        </p>
                      </div>
                      <Toggle
                        on={preferences.largeControls}
                        setOn={(value) =>
                          updatePreference("largeControls", value)
                        }
                        label="Aumentar área dos controles"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                onClick={onReset}
                className="rounded-xl px-4 py-3 text-sm font-bold text-muted hover:bg-surface hover:text-ink"
              >
                Restaurar padrão
              </Button>
              <Button
                onClick={onContinue}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-extrabold text-white shadow-brand hover:bg-green"
              >
                Entrar no Money Buddy
                <Icon name="arrow" size="size-4" />
              </Button>
            </div>
            <p className="mt-4 text-center text-xs leading-relaxed text-muted sm:text-right">
              Suas preferências valem nesta sessão e podem ser alteradas em
              Configurações.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

function VLibrasWidget() {
  useEffect(() => {
    const initializeWidget = () => {
      if (
        window.VLibras &&
        !document.querySelector("[vw-plugin-wrapper] iframe")
      ) {
        new window.VLibras.Widget("https://vlibras.gov.br/app")
      }
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-money-buddy-vlibras="true"]',
    )

    if (existingScript) {
      if (window.VLibras) {
        initializeWidget()
      } else {
        existingScript.addEventListener("load", initializeWidget, {
          once: true,
        })
      }

      return () => {
        existingScript.removeEventListener("load", initializeWidget)
      }
    }

    const script = document.createElement("script")
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js"
    script.async = true
    script.dataset.moneyBuddyVlibras = "true"
    script.addEventListener("load", initializeWidget, { once: true })
    document.body.appendChild(script)

    return () => {
      script.removeEventListener("load", initializeWidget)
    }
  }, [])

  return (
    <div {...{ vw: "true" }} className="enabled">
      <div {...{ "vw-access-button": "true" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "true" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}

function InfoModal({
  content,
  onClose,
  marked,
  toggleMark,
}: {
  content: InfoModalContent
  onClose: () => void
  marked: Set<string>
  toggleMark: (id: string) => void
}) {
  const dialogRef = useDialogFocus(onClose)
  const feedback = useFeedback()

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-overlay p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-card bg-white shadow-floating"
      >
        <div className="flex items-start justify-between gap-5 border-b border-line p-6 md:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <Icon name={content.icon} />
            </span>
            <div>
              <p className="text-xs font-extrabold tracking-widest text-primary">
                {content.eyebrow}
              </p>
              <p
                id="info-modal-title"
                className="mt-2 text-2xl font-extrabold tracking-tight"
              >
                {content.title}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            aria-label="Fechar explicação"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted hover:bg-primary-soft hover:text-primary"
          >
            <Icon name="close" />
          </Button>
        </div>

        <div className="p-6 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-3 text-sm">
            <p>Seus destaques ficam nesta sessão.</p>
            <Button
              className="a11y-control"
              onClick={() => {
                if ("speechSynthesis" in window) {
                  window.speechSynthesis.cancel()
                  const speech = new SpeechSynthesisUtterance(
                    [
                      content.title,
                      content.description,
                      ...content.highlights,
                      content.note,
                    ]
                      .filter(Boolean)
                      .join(". "),
                  )
                  speech.lang = "pt-BR"
                  window.speechSynthesis.speak(speech)
                } else
                  feedback(
                    "Este navegador não oferece leitura por voz. Use seu leitor de tela.",
                    true,
                  )
              }}
            >
              Ouvir conteúdo
            </Button>
            <Button
              className="a11y-control"
              onClick={() => window.speechSynthesis?.cancel()}
            >
              Parar leitura
            </Button>
          </div>
          <ReadingText
            id={`${content.title}:description`}
            marked={marked.has(`${content.title}:description`)}
            toggle={toggleMark}
          >
            {content.description}
          </ReadingText>
          <div className="mt-6">
            <p className="text-sm font-extrabold text-ink">
              O que você precisa saber
            </p>
            <div className="mt-3 space-y-3">
              {content.highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="flex items-start gap-3 rounded-xl bg-surface p-4"
                >
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-white">
                    <Icon name="check" size="size-4" />
                  </span>
                  <ReadingText
                    id={highlight}
                    marked={marked.has(highlight)}
                    toggle={toggleMark}
                  >
                    {highlight}
                  </ReadingText>
                </div>
              ))}
            </div>
          </div>

          {content.note && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-orange/20 bg-orange-soft p-4">
              <span className="shrink-0 text-orange">
                <Icon name="bell" />
              </span>
              <ReadingText
                id={content.note}
                marked={marked.has(content.note)}
                toggle={toggleMark}
              >
                {content.note}
              </ReadingText>
            </div>
          )}

          <Button
            onClick={onClose}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-white hover:bg-green"
          >
            Entendi
          </Button>
        </div>
      </section>
    </div>
  )
}

function AddExpenseModal({
  initialCategory,
  onClose,
  onAdd,
}: {
  initialCategory?: string
  onClose: () => void
  onAdd: (expense: Omit<ExpenseRecord, "id" | "date">) => void
}) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(
    initialCategory ?? expenseCategories[1].label,
  )
  const [errors, setErrors] = useState<{
    description?: string
    amount?: string
  }>({})
  const feedback = useFeedback()
  const dialogRef = useDialogFocus(onClose)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validFormat = /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(
      amount.trim(),
    )
    const parsedAmount = Number(
      amount.trim().replace(/\./g, "").replace(",", "."),
    )
    const nextErrors = {
      description: description.trim()
        ? undefined
        : "Informe uma descrição para o gasto.",
      amount:
        validFormat &&
        Number.isFinite(parsedAmount) &&
        parsedAmount > 0 &&
        parsedAmount <= 999999999
          ? undefined
          : "Informe um valor entre R$ 0,01 e R$ 999.999.999,00. Use vírgula para os centavos.",
    }
    setErrors(nextErrors)
    if (nextErrors.description || nextErrors.amount) {
      feedback(
        [nextErrors.description, nextErrors.amount].filter(Boolean).join(" "),
        true,
      )
      event.currentTarget
        .querySelector<HTMLInputElement>(
          nextErrors.description ? "#expense-description" : "#expense-amount",
        )
        ?.focus()
      return
    }

    onAdd({
      description: description.trim(),
      category,
      amount: parsedAmount,
    })
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-overlay p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-modal-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-card bg-white shadow-floating"
      >
        <div className="flex items-start justify-between gap-5 border-b border-line p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-coral-soft text-coral">
              <Icon name="plus" />
            </span>
            <div>
              <p className="text-xs font-extrabold tracking-widest text-primary">
                NOVO LANÇAMENTO
              </p>
              <p
                id="expense-modal-title"
                className="mt-2 text-2xl font-extrabold tracking-tight"
              >
                Adicionar gasto
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            aria-label="Fechar formulário"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-muted hover:bg-primary-soft hover:text-primary"
          >
            <Icon name="close" />
          </Button>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          autoComplete="on"
          className="p-6"
        >
          <p className="mb-4 text-xs text-muted">
            Todos os campos são obrigatórios. A categoria já vem selecionada e
            pode ser alterada.
          </p>
          <label className="block">
            <span className="text-sm font-bold text-ink">
              Descrição do gasto (obrigatório)
            </span>
            <input
              autoFocus
              required
              id="expense-description"
              name="expense-description"
              autoComplete="on"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ex.: almoço, aluguel, transporte"
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-focus/30"
            />
          </label>
          {errors.description && (
            <p
              id="description-error"
              className="mt-2 text-sm font-bold text-coral"
            >
              {errors.description}
            </p>
          )}

          <label className="mt-5 block">
            <span className="text-sm font-bold text-ink">
              Valor (obrigatório)
            </span>
            <span className="mt-2 flex items-center rounded-xl border border-line bg-white px-4 focus-within:border-primary focus-within:ring-4 focus-within:ring-focus/30">
              <span className="text-sm font-bold text-muted">R$</span>
              <input
                required
                id="expense-amount"
                name="transaction-amount"
                autoComplete="transaction-amount"
                aria-invalid={Boolean(errors.amount)}
                aria-describedby="amount-help amount-error"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                aria-label="Valor do gasto em reais, obrigatório"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold outline-none placeholder:text-muted/60"
              />
            </span>
          </label>
          <p id="amount-help" className="mt-2 text-xs text-muted">
            Em reais. Exemplo: 25,90.
          </p>
          <p id="amount-error" className="mt-2 text-sm font-bold text-coral">
            {errors.amount}
          </p>

          <fieldset className="mt-5" role="radiogroup" aria-required="true">
            <legend className="text-sm font-bold text-ink">
              Categoria (obrigatória)
            </legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {expenseCategories.map((item) => (
                <label
                  key={item.label}
                  className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-left text-sm font-bold focus-within:ring-4 focus-within:ring-focus ${
                    category === item.label
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-line text-muted hover:border-primary/30 hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    className="size-4 accent-primary"
                    name="expense-category"
                    value={item.label}
                    required
                    checked={category === item.label}
                    onChange={() => setCategory(item.label)}
                  />
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg ${item.tone}`}
                  >
                    <Icon name={item.icon} size="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {category === item.label && (
                    <Icon name="check" size="size-4" />
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-3 text-sm font-bold text-muted hover:bg-surface hover:text-ink"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white shadow-brand hover:bg-green"
            >
              <Icon name="check" size="size-4" />
              Salvar gasto
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ExpenseDashboard({
  categoryTotals,
  records,
  onAddExpense,
}: {
  categoryTotals: Record<string, number>
  records: ExpenseRecord[]
  onAddExpense: (category?: string) => void
}) {
  const total = Object.values(categoryTotals).reduce(
    (sum, value) => sum + value,
    0,
  )
  const monthlyBudget = 4000
  const remaining = Math.max(monthlyBudget - total, 0)
  const budgetPercentage = Math.min((total / monthlyBudget) * 100, 100)
  const largestCategory = expenseCategories.reduce((largest, category) =>
    (categoryTotals[category.label] ?? 0) > (categoryTotals[largest.label] ?? 0)
      ? category
      : largest,
  )
  const weeklyBars = [
    { label: "Sem 1", height: "h-20", value: "R$ 486" },
    { label: "Sem 2", height: "h-28", value: "R$ 734" },
    { label: "Sem 3", height: "h-24", value: "R$ 612" },
    { label: "Sem 4", height: "h-36", value: "R$ 971" },
    { label: "Atual", height: "h-16", value: formatCurrency(total - 2803) },
  ]

  return (
    <div>
      <section className="relative overflow-hidden rounded-card bg-hero p-7 text-white shadow-card md:p-9">
        <div className="absolute -right-16 -top-20 size-72 rounded-full border border-white/10" />
        <div className="absolute -bottom-28 right-40 size-56 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-mint">
              <Icon name="chart" size="size-4" />
              CONTROLE DE GASTOS
            </span>
            <p className="mt-5 text-3xl font-extrabold tracking-tight md:text-4xl">
              Seu dinheiro, com mais contexto
            </p>
            <p className="mt-3 max-w-xl leading-relaxed text-white/70">
              Acompanhe padrões, compare categorias e registre novos gastos sem
              perder o ritmo do seu mês.
            </p>
          </div>
          <Button
            onClick={() => onAddExpense()}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-extrabold text-white shadow-brand hover:bg-green"
          >
            <Icon name="plus" />
            Adicionar gasto
          </Button>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Gasto no mês",
            value: formatCurrency(total),
            detail: `${Math.round((total / 5850) * 100)}% da sua renda`,
            icon: "wallet" as IconName,
            tone: "bg-coral-soft text-coral",
          },
          {
            label: "Orçamento disponível",
            value: formatCurrency(remaining),
            detail: `Meta mensal de ${formatCurrency(monthlyBudget)}`,
            icon: "shield" as IconName,
            tone: "bg-green-soft text-green",
          },
          {
            label: "Maior categoria",
            value: largestCategory.label,
            detail: formatCurrency(categoryTotals[largestCategory.label] ?? 0),
            icon: largestCategory.icon,
            tone: largestCategory.tone,
          },
          {
            label: "Média por dia",
            value: formatCurrency(total / 29),
            detail: "29 dias acompanhados",
            icon: "calendar" as IconName,
            tone: "bg-blue-soft text-blue",
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-card border border-line bg-white p-5 shadow-card"
          >
            <span
              className={`grid size-10 place-items-center rounded-xl ${metric.tone}`}
            >
              <Icon name={metric.icon} size="size-4" />
            </span>
            <p className="mt-4 text-sm text-muted">{metric.label}</p>
            <p className="mt-1 text-xl font-extrabold tracking-tight">
              {metric.value}
            </p>
            <p className="mt-2 text-xs font-semibold text-green">
              {metric.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-card border border-line bg-white p-6 shadow-card md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-extrabold">Ritmo de gastos</p>
              <p className="mt-1 text-sm text-muted">
                Comparação entre as semanas do mês
              </p>
            </div>
            <span className="rounded-full bg-green-soft px-3 py-1.5 text-xs font-bold text-green">
              8% abaixo do mês anterior
            </span>
          </div>
          <div className="mt-8 flex h-48 items-end justify-between gap-3 border-b border-line px-2">
            {weeklyBars.map((bar, index) => (
              <div
                key={bar.label}
                className="flex h-full flex-1 flex-col items-center justify-end"
              >
                <span className="mb-2 text-xs font-bold text-muted">
                  {bar.value}
                </span>
                <div
                  className={`${bar.height} w-full max-w-14 rounded-t-xl ${
                    index === weeklyBars.length - 1
                      ? "bg-primary"
                      : "bg-primary-soft"
                  }`}
                />
                <span className="py-3 text-xs font-semibold text-muted">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-line bg-white p-6 shadow-card md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-extrabold">Orçamento mensal</p>
              <p className="mt-1 text-sm text-muted">Limite planejado</p>
            </div>
            <span className="text-sm font-extrabold text-primary">
              {Math.round(budgetPercentage)}%
            </span>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full rounded-full bg-primary ${getProgressWidth(
                budgetPercentage,
              )}`}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>{formatCurrency(total)} utilizados</span>
            <span>{formatCurrency(monthlyBudget)}</span>
          </div>
          <div className="mt-6 rounded-xl bg-primary-soft p-4">
            <p className="text-sm font-extrabold text-primary">
              Você ainda pode gastar {formatCurrency(remaining)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Mantendo o ritmo atual, você encerra o mês dentro do planejado.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-lg font-extrabold">Categorias</p>
            <p className="mt-1 text-sm text-muted">
              Acompanhe o limite e adicione diretamente em cada grupo
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {expenseCategories.map((category) => {
            const categoryValue = categoryTotals[category.label] ?? 0
            const percentage = Math.min(
              (categoryValue / category.budget) * 100,
              100,
            )

            return (
              <div
                key={category.label}
                className="rounded-card border border-line bg-white p-5 shadow-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${category.tone}`}
                  >
                    <Icon name={category.icon} />
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {Math.round(percentage)}% do limite
                  </span>
                </div>
                <p className="mt-4 font-extrabold">{category.label}</p>
                <p className="mt-1 text-xl font-extrabold tracking-tight">
                  {formatCurrency(categoryValue)}
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full bg-primary ${getProgressWidth(
                      percentage,
                    )}`}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted">
                  <span>Gasto atual</span>
                  <span>Limite {formatCurrency(category.budget)}</span>
                </div>
                <Button
                  onClick={() => onAddExpense(category.label)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary-soft"
                >
                  <Icon name="plus" size="size-4" />
                  Adicionar nesta categoria
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-card border border-line bg-white p-6 shadow-card md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-extrabold">Lançamentos recentes</p>
            <p className="mt-1 text-sm text-muted">
              Seus últimos gastos registrados
            </p>
          </div>
          <Button
            onClick={() => onAddExpense()}
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white hover:bg-primary"
          >
            <Icon name="plus" size="size-4" />
            Novo lançamento
          </Button>
        </div>
        <div className="mt-5 divide-y divide-line">
          {records.slice(0, 6).map((record) => {
            const category = expenseCategories.find(
              (item) => item.label === record.category,
            )

            return (
              <div key={record.id} className="flex items-center gap-4 py-4">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                    category?.tone ?? "bg-surface text-muted"
                  }`}
                >
                  <Icon name={category?.icon ?? "wallet"} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {record.description}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">
                    {record.category} • {record.date}
                  </p>
                </div>
                <p className="text-sm font-extrabold text-coral">
                  − {formatCurrency(record.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

const pageContent: Record<string, {
  eyebrow: string
  title: string
  description: string
  icon: IconName
  metrics: {
    label: string
    value: string
    detail: string
  }[]
  items: {
    title: string
    detail: string
    value: string
    icon: IconName
  }[]
}> = {
  "Minha carteira": {
    eyebrow: "CARTEIRA CONECTADA",
    title: "Todas as suas rendas em um só lugar",
    description:
      "Acompanhe contas, rendimentos e a evolução do seu patrimônio com clareza.",
    icon: "wallet",
    metrics: [
      {
        label: "Saldo disponível",
        value: "R$ 8.460,20",
        detail: "+8,4% neste mês",
      },
      {
        label: "Renda recorrente",
        value: "R$ 5.850,00",
        detail: "3 fontes ativas",
      },
      {
        label: "Reserva acumulada",
        value: "R$ 12.340,00",
        detail: "41% da sua meta",
      },
    ],
    items: [
      {
        title: "Salário — Studio Norte",
        detail: "Conta principal • recebido dia 05",
        value: "R$ 4.200,00",
        icon: "wallet",
      },
      {
        title: "Projetos freelance",
        detail: "Média dos últimos 3 meses",
        value: "R$ 1.250,00",
        icon: "trend",
      },
      {
        title: "Rendimentos",
        detail: "CDB e Tesouro Selic",
        value: "R$ 400,00",
        icon: "chart",
      },
    ],
  },
  Gastos: {
    eyebrow: "ANÁLISE DE GASTOS",
    title: "Entenda seus hábitos sem julgamentos",
    description:
      "Categorias automáticas e padrões ajudam você a decidir onde vale ajustar.",
    icon: "chart",
    metrics: [
      {
        label: "Gasto no mês",
        value: "R$ 3.146,80",
        detail: "54% da sua renda",
      },
      { label: "Maior categoria", value: "Moradia", detail: "R$ 1.280,00" },
      {
        label: "Economia possível",
        value: "R$ 286,00",
        detail: "Sugestão do Buddy",
      },
    ],
    items: [
      {
        title: "Moradia",
        detail: "Aluguel, energia e internet",
        value: "R$ 1.280,00",
        icon: "homeExpense",
      },
      {
        title: "Alimentação",
        detail: "12% acima da última quinzena",
        value: "R$ 742,00",
        icon: "food",
      },
      {
        title: "Transporte",
        detail: "Dentro da média planejada",
        value: "R$ 463,00",
        icon: "transport",
      },
    ],
  },
  "Calendário fiscal": {
    eyebrow: "AGENDA FISCAL",
    title: "Seus compromissos, sem surpresas",
    description:
      "Prazos, documentos e lembretes fiscais explicados de forma simples.",
    icon: "calendar",
    metrics: [
      {
        label: "Próximo prazo",
        value: "30 out",
        detail: "Carnê-Leão de setembro",
      },
      { label: "Agenda do MEI", value: "20 nov", detail: "DAS de outubro" },
      {
        label: "Obrigações mapeadas",
        value: "3",
        detail: "Confira se aplicam",
      },
    ],
    items: [
      {
        title: "Carnê-Leão — setembro",
        detail: "Para renda de pessoa física ou do exterior",
        value: "30 OUT",
        icon: "tax",
      },
      {
        title: "DAS — MEI outubro",
        detail: "Guia mensal do microempreendedor",
        value: "20 NOV",
        icon: "calendar",
      },
      {
        title: "DASN-SIMEI 2027",
        detail: "Declaração anual referente a 2026",
        value: "31 MAI",
        icon: "tax",
      },
    ],
  },
  Aprender: {
    eyebrow: "TRILHA MONEY BUDDY",
    title: "Aprenda no seu ritmo",
    description:
      "Conteúdos curtos e confiáveis para transformar informação em boas escolhas.",
    icon: "learn",
    metrics: [
      {
        label: "Sua sequência",
        value: "6 dias",
        detail: "Seu melhor resultado",
      },
      { label: "Cards concluídos", value: "14", detail: "Neste mês" },
      { label: "Próximo nível", value: "72%", detail: "Explorador financeiro" },
    ],
    items: [
      {
        title: "Reserva de emergência",
        detail: "Leitura de 5 minutos • Básico",
        value: "Continuar",
        icon: "shield",
      },
      {
        title: "Como declarar renda extra",
        detail: "Leitura de 7 minutos • Fiscal",
        value: "Começar",
        icon: "tax",
      },
      {
        title: "CDB, Tesouro ou poupança?",
        detail: "Leitura de 6 minutos • Investimentos",
        value: "Começar",
        icon: "trend",
      },
    ],
  },
  Privacidade: {
    eyebrow: "CENTRAL DE PRIVACIDADE",
    title: "Seus dados pertencem a você",
    description:
      "Veja como cada informação é protegida e escolha o que deseja compartilhar.",
    icon: "shield",
    metrics: [
      {
        label: "Nível de proteção",
        value: "Forte",
        detail: "Todas as camadas ativas",
      },
      { label: "Acessos recentes", value: "2", detail: "Ambos reconhecidos" },
      {
        label: "Dados compartilhados",
        value: "Nenhum",
        detail: "Controle total",
      },
    ],
    items: [
      {
        title: "Criptografia dos dados",
        detail: "Proteção durante envio e armazenamento",
        value: "Ativa",
        icon: "lock",
      },
      {
        title: "Autenticação em duas etapas",
        detail: "Confirmação extra em novos dispositivos",
        value: "Ativa",
        icon: "shield",
      },
      {
        title: "Baixar meus dados",
        detail: "Exporte uma cópia das suas informações",
        value: "Solicitar",
        icon: "arrow",
      },
    ],
  },
}

function ExplorerPage({
  section,
  onOpenInfo,
}: {
  section: string
  onOpenInfo: (content: InfoModalContent) => void
}) {
  const [view, setView] = useState("Resumo")
  const page = pageContent[section]
  const feedback = useFeedback()

  return (
    <div>
      <section className="relative overflow-hidden rounded-card bg-hero p-7 text-white shadow-card md:p-10">
        <div className="absolute -right-12 -top-16 size-56 rounded-full border border-white/10" />
        <div className="relative max-w-3xl">
          <div className="mb-5 grid size-12 place-items-center rounded-xl bg-white/10 text-mint">
            <Icon name={page.icon} />
          </div>
          <p className="text-xs font-extrabold tracking-widest text-mint">
            {page.eyebrow}
          </p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">
            {page.title}
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-white/70">
            {page.description}
          </p>
        </div>
      </section>

      <div
        className="mt-7 flex w-fit rounded-xl bg-surface p-1"
        role="group"
        aria-label={`Visualização de ${section}`}
      >
        {["Resumo", "Atividade recente"].map((item) => (
          <Button
            key={item}
            aria-pressed={view === item}
            onClick={() => {
              setView(item)
              feedback(`${item} de ${section}.`)
            }}
            className={`rounded-lg px-4 py-2.5 text-sm font-bold ${
              view === item ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            {item}
          </Button>
        ))}
      </div>

      {view === "Resumo" ? (
        <>
          <section className="mt-5 grid gap-5 md:grid-cols-3">
            {page.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-card border border-line bg-white p-6 shadow-card"
              >
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="mt-2 text-2xl font-extrabold tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs font-semibold text-green">
                  {metric.detail}
                </p>
              </div>
            ))}
          </section>
          <section className="mt-7 rounded-card border border-line bg-white p-6 shadow-card md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-extrabold">Detalhes</p>
                <p className="mt-1 text-sm text-muted">
                  Informações importantes desta área
                </p>
              </div>
              <Button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-green">
                Adicionar <Icon name="plus" size="size-4" />
              </Button>
            </div>
            <div className="mt-5 divide-y divide-line">
              {page.items.map((item) => (
                <Button
                  key={item.title}
                  onClick={() => {
                    const details =
                      fiscalDetails[item.title] ??
                      (section === "Aprender"
                        ? learningDetails[item.title]
                        : undefined)
                    if (details) onOpenInfo(details)
                  }}
                  aria-haspopup={
                    fiscalDetails[item.title] ||
                    (section === "Aprender" && learningDetails[item.title])
                      ? "dialog"
                      : undefined
                  }
                  className="flex w-full items-center gap-4 py-4 text-left hover:px-2"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon name={item.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {item.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {item.detail}
                    </span>
                  </span>
                  <span className="text-sm font-extrabold text-ink">
                    {item.value}
                  </span>
                  <Icon name="arrow" size="size-4" />
                </Button>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-5 rounded-card border border-line bg-white p-6 shadow-card md:p-7">
          <p className="text-lg font-extrabold">Atividade recente</p>
          <div className="mt-6 space-y-6">
            {["Hoje, 09:42", "Ontem, 18:15", "12 de abril, 14:30"].map(
              (date, index) => (
                <div key={date} className="flex gap-4">
                  <span
                    className={`mt-1 size-3 shrink-0 rounded-full ${
                      index === 0 ? "bg-primary" : "bg-line"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold">
                      {index === 0
                        ? `${section} atualizada`
                        : index === 1
                          ? "Novo registro categorizado"
                          : "Preferências sincronizadas"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {date} • Atualização segura
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}
    </div>
  )
}

function MoneyBuddy({
  preferences,
  setPreferences,
}: {
  preferences: AccessibilityPreferences
  setPreferences: React.Dispatch<React.SetStateAction<AccessibilityPreferences>>
}) {
  const [started, setStarted] = useState(false)
  const feedback = useFeedback()
  const [imageOpen, setImageOpen] = useState(false)
  const [marked, setMarked] = useState<Set<string>>(() => new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState("Visão geral")
  const [showBalance, setShowBalance] = useState(true)
  const [period, setPeriod] = useState("Este mês")
  const [incomeAdded, setIncomeAdded] = useState(false)
  const [activeModal, setActiveModal] = useState<InfoModalContent | null>(null)
  const [categoryTotals, setCategoryTotals] = useState(initialCategoryTotals)
  const [expenseRecords, setExpenseRecords] = useState(initialExpenseRecords)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [expenseModalCategory, setExpenseModalCategory] =
    useState<string | undefined>()

  const updatePreference = <Key extends keyof AccessibilityPreferences,>(
    key: Key,
    value: AccessibilityPreferences[Key],
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
      ...(key === "contrast"
        ? {
            theme:
              value === "Alto contraste"
                ? "Alto contraste" as const
                : "Claro" as const,
          }
        : {}),
      ...(key === "theme"
        ? {
            contrast:
              value === "Alto contraste"
                ? "Alto contraste" as const
                : "Padrão" as const,
          }
        : {}),
    }))
  }

  const accessibilityClasses = [
    preferences.reduceMotion ? "reduce-motion" : "",
    preferences.largeControls ? "large-controls" : "",
  ]
    .filter(Boolean)
    .join(" ")

  useEffect(() => {
    const root = document.documentElement
    root.lang = "pt-BR"
    const customSafe =
      contrastRatio(preferences.background, preferences.foreground) >= 4.5
    root.dataset.theme =
      preferences.theme === "Personalizado" && !customSafe
        ? "Claro"
        : preferences.theme
    root.dataset.inverted = String(preferences.inverted)
    root.dataset.lineHeight = preferences.lineHeight
    root.dataset.highlight = preferences.highlight
    root.style.setProperty(
      "--reader-font",
      `${preferences.fontFamily}, ${
        preferences.fontFamily === "Georgia" ? "serif" : "sans-serif"
      }`,
    )
    root.style.setProperty("--custom-bg", preferences.background)
    root.style.setProperty("--custom-fg", preferences.foreground)
    root.style.fontSize = `${
      preferences.fontScale === "Grande"
        ? 112.5
        : preferences.fontScale === "Muito grande"
          ? 125
          : 100
    }%`
    root.style.zoom = String(preferences.pageZoom / 100)
  }, [preferences])

  const lastPreferences = useRef(preferences)
  useEffect(() => {
    if (lastPreferences.current === preferences) return
    lastPreferences.current = preferences
    const details = [
      `Fonte ${preferences.fontFamily}, tamanho ${preferences.fontScale.toLowerCase()}.`,
      `Tema ${preferences.theme.toLowerCase()}, página ${preferences.pageZoom} por cento.`,
      `Espaçamento ${preferences.lineHeight.toLowerCase()}.`,
      `Voz ${preferences.audio ? "ativada" : "desativada"}, sons ${
        preferences.sound ? "ativados" : "desativados"
      }, vibração ${
        preferences.vibration ? "ativada, quando disponível" : "desativada"
      }.`,
    ].join(" ")
    feedback(`Preferências atualizadas. ${details}`)
  }, [preferences, feedback])

  const lastView = useRef({ started, active, period, showBalance })
  useEffect(() => {
    const previous = lastView.current
    lastView.current = { started, active, period, showBalance }
    if (started !== previous.started) {
      feedback(
        started
          ? `${active}. Bem-vindo ao Money Buddy.`
          : "Configurações de acessibilidade abertas.",
      )
      document
        .getElementById(started ? "main-content" : "accessibility-title")
        ?.focus()
    } else if (active !== previous.active) {
      feedback(`Seção ${active} aberta.`)
      document.getElementById("main-content")?.focus()
    } else if (period !== previous.period)
      feedback(`Período selecionado: ${period}.`)
    else if (showBalance !== previous.showBalance)
      feedback(showBalance ? "Valores visíveis." : "Valores ocultos.")
  }, [started, active, period, showBalance, feedback])

  useEffect(() => {
    if (!activeModal) return
    feedback(`${activeModal.title}. ${activeModal.description}`)
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [activeModal, feedback])

  useEffect(() => {
    if (!preferences.shortcuts) return
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        event.repeat ||
        event.isComposing ||
        !event.altKey ||
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        target.closest("input, select, textarea, [contenteditable=true]") ||
        document.querySelector('[role="dialog"]')
      )
        return
      const code = event.code
      if (code === "KeyA") {
        event.preventDefault()
        setMenuOpen(false)
        setStarted(false)
      } else if (started && code === "KeyN") {
        event.preventDefault()
        setExpenseModalCategory(undefined)
        setExpenseModalOpen(true)
      } else if (started && /^Digit[1-6]$/.test(code)) {
        event.preventDefault()
        setActive(navItems[Number(code.slice(-1)) - 1].label)
        setMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [preferences.shortcuts, started])

  const toggleMark = (id: string) => {
    const isMarked = marked.has(id)
    setMarked((current) => {
      const next = new Set(current)
      if (isMarked) next.delete(id)
      else next.add(id)
      return next
    })
    feedback(isMarked ? "Destaque removido." : "Trecho destacado.")
  }

  const totalExpenses = Object.values(categoryTotals).reduce(
    (sum, value) => sum + value,
    0,
  )
  const overviewExpenses = expenseCategories.map((category) => {
    const value = categoryTotals[category.label] ?? 0
    const percent = Math.round((value / totalExpenses) * 100)

    return {
      ...category,
      value,
      percent,
      width: getProgressWidth(percent * 2),
    }
  })

  const openExpenseModal = (category?: string) => {
    setExpenseModalCategory(category)
    setExpenseModalOpen(true)
  }

  const addExpense = (expense: Omit<ExpenseRecord, "id" | "date">) => {
    const newExpense: ExpenseRecord = {
      ...expense,
      id: Date.now(),
      date: "Agora",
    }

    setExpenseRecords((current) => [newExpense, ...current])
    setCategoryTotals((current) => ({
      ...current,
      [expense.category]: (current[expense.category] ?? 0) + expense.amount,
    }))
    setExpenseModalOpen(false)
    setExpenseModalCategory(undefined)
    feedback(
      `Gasto de ${formatCurrency(expense.amount)} em ${expense.category} adicionado. Os totais foram atualizados nesta sessão.`,
    )
  }

  if (!started) {
    return (
      <div className={accessibilityClasses}>
        <div data-app-content>
          <AccessibilityWelcome
            preferences={preferences}
            updatePreference={updatePreference}
            onContinue={() => setStarted(true)}
            onReset={() => {
              setPreferences(defaultPreferences)
              setMarked(new Set())
            }}
            onZoomImage={() => setImageOpen(true)}
          />
        </div>
        {imageOpen && (
          <ImageZoom src={mascotImage} onClose={() => setImageOpen(false)} />
        )}
        {preferences.libras && <VLibrasWidget />}
      </div>
    )
  }

  return (
    <div className={`${accessibilityClasses} min-h-screen bg-canvas text-ink`}>
      <div data-app-content className="app-layout flex min-h-screen">
        <a href="#main-content" className="skip-link">
          Pular para o conteúdo
        </a>
        <Sidebar
          open={menuOpen}
          close={() => setMenuOpen(false)}
          active={active}
          setActive={setActive}
          openAccessibility={() => {
            setMenuOpen(false)
            setStarted(false)
          }}
        />
        {menuOpen && (
          <div
            className="fixed inset-0 z-40 bg-overlay lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-line bg-canvas/95 px-5 backdrop-blur md:px-9">
            <div className="flex items-center gap-3">
              <Button
                aria-label="Abrir menu"
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-line bg-white p-2.5 text-ink lg:hidden"
              >
                <Icon name="menu" />
              </Button>
              <div>
                <p className="text-lg font-extrabold tracking-tight md:text-xl">
                  {active === "Visão geral" ? "Olá, Lucas!" : active}
                </p>
                <p className="hidden text-sm text-muted sm:block">
                  {active === "Visão geral"
                    ? "Vamos cuidar do seu futuro hoje."
                    : "Explore seus dados e recomendações."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                aria-label="Abrir configurações de acessibilidade"
                aria-keyshortcuts="Alt+Shift+A"
                onClick={() => setStarted(false)}
                className="rounded-xl border border-line bg-white p-2.5 text-ink"
              >
                <Icon name="settings" />
              </Button>
              <Button
                onClick={() => openExpenseModal()}
                className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white hover:bg-green"
              >
                <Icon name="plus" size="size-4" />
                <span className="hidden md:inline">Novo gasto</span>
              </Button>
              <div className="hidden items-center gap-2 rounded-full border border-green/20 bg-green-soft px-3 py-2 text-xs font-bold text-green sm:flex">
                <span className="size-2 rounded-full bg-green" /> Dados
                protegidos
              </div>
              <Button
                aria-label="Notificações, duas novas"
                className="relative rounded-full border border-line bg-white p-2.5 text-muted hover:text-ink"
              >
                <Icon name="bell" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-white bg-coral" />
              </Button>
              <div className="grid size-10 place-items-center rounded-full bg-avatar text-sm font-bold text-primary md:hidden">
                LM
              </div>
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto max-w-screen-2xl p-5 outline-none md:p-9"
          >
            {active === "Visão geral" ? (
              <>
                <section
                  aria-label="Resumo financeiro"
                  className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"
                >
                  <div className="relative overflow-hidden rounded-card bg-hero p-6 text-white shadow-card md:p-8">
                    <div className="absolute -right-10 -top-20 size-64 rounded-full border border-white/10" />
                    <div className="absolute -bottom-32 right-24 size-64 rounded-full bg-white/5" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white/75">
                          Seu saldo total
                        </p>
                        <Button
                          onClick={() => setShowBalance(!showBalance)}
                          aria-label={
                            showBalance ? "Ocultar saldo" : "Mostrar saldo"
                          }
                          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
                        >
                          <Icon name="eye" />
                        </Button>
                      </div>
                      <div className="mt-2 flex items-end gap-3">
                        <p className="text-3xl font-extrabold tracking-tight md:text-4xl">
                          {showBalance ? "R$ 8.460,20" : "R$ ••••••"}
                        </p>
                        <span className="mb-1.5 rounded-full bg-white/15 px-2 py-1 text-xs font-bold text-mint">
                          +8,4%
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/60">
                        Atualizado hoje, às 09:42
                      </p>
                      <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-5">
                        <div>
                          <p className="text-xs text-white/60">Entradas</p>
                          <p className="mt-1 font-bold text-mint">
                            + R$ 5.850,00
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Saídas</p>
                          <p className="mt-1 font-bold text-coral-light">
                            − {formatCurrency(totalExpenses)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-card border border-line bg-white p-6 shadow-card">
                    <div className="flex items-start justify-between">
                      <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                        <Icon name="wallet" />
                      </div>
                      <span className="rounded-full bg-green-soft px-3 py-1 text-xs font-bold text-green">
                        3 fontes ativas
                      </span>
                    </div>
                    <p className="mt-5 text-sm text-muted">
                      Renda mensal consolidada
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight">
                      R$ 5.850,00
                    </p>
                    <div className="mt-5 flex -space-x-2">
                      {["CLT", "FR", "IN"].map((item, index) => (
                        <span
                          key={item}
                          className={`grid size-8 place-items-center rounded-full border-2 border-white text-xs font-bold ${
                            index === 0
                              ? "bg-blue-soft text-blue"
                              : index === 1
                                ? "bg-violet-soft text-violet"
                                : "bg-orange-soft text-orange"
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <Button
                      onClick={() => {
                        setIncomeAdded(true)
                        feedback(
                          "Demonstração de fonte de renda adicionada nesta sessão. Nenhuma conta bancária foi conectada.",
                        )
                      }}
                      disabled={incomeAdded}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/25 px-4 py-3 text-sm font-bold text-primary hover:bg-primary-soft disabled:cursor-default disabled:border-green/20 disabled:bg-green-soft disabled:text-green"
                    >
                      <Icon name={incomeAdded ? "check" : "plus"} />{" "}
                      {incomeAdded
                        ? "Fonte adicionada"
                        : "Adicionar fonte de renda"}
                    </Button>
                  </div>
                </section>

                <section className="mt-8 grid gap-7 xl:grid-cols-[1.55fr_1fr]">
                  <div className="rounded-card border border-line bg-white p-6 shadow-card md:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-extrabold">
                          Para onde vai seu dinheiro
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          Distribuição dos seus gastos por categoria
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          onClick={() => openExpenseModal()}
                          className="flex items-center gap-2 rounded-xl border border-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary-soft"
                        >
                          <Icon name="plus" size="size-4" />
                          Adicionar gasto
                        </Button>
                        <div
                          className="flex rounded-xl bg-surface p-1"
                          aria-label="Período dos gastos"
                        >
                          {["Este mês", "3 meses"].map((item) => (
                            <Button
                              key={item}
                              onClick={() => setPeriod(item)}
                              aria-pressed={period === item}
                              className={`rounded-lg px-3 py-2 text-xs font-bold ${
                                period === item
                                  ? "bg-white text-ink shadow-sm"
                                  : "text-muted"
                              }`}
                            >
                              {item}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-7 grid gap-7 md:grid-cols-[auto_1fr] md:items-center">
                      <div className="relative mx-auto grid size-44 place-items-center rounded-full bg-spending-chart">
                        <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                          <div>
                            <p className="text-xs text-muted">Total gasto</p>
                            <p className="mt-1 text-lg font-extrabold">
                              {period === "Este mês"
                                ? formatCurrency(totalExpenses)
                                : formatCurrency(totalExpenses * 2.85)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {overviewExpenses.map((expense) => (
                          <div
                            key={expense.label}
                            className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                          >
                            <div
                              className={`grid size-9 place-items-center rounded-lg ${expense.tone}`}
                            >
                              <Icon name={expense.icon} size="size-4" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold">
                                  {expense.label}
                                </span>
                                <span className="text-muted">
                                  {expense.percent}%
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
                                <div
                                  className={`h-full rounded-full bg-primary ${expense.width}`}
                                />
                              </div>
                            </div>
                            <span className="w-20 text-right text-sm font-bold">
                              {formatCurrency(expense.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-7 flex items-start gap-3 rounded-xl border border-orange/15 bg-orange-soft p-4">
                      <div className="mt-0.5 text-orange">
                        <Icon name="trend" />
                      </div>
                      <p className="text-sm leading-relaxed text-ink">
                        <strong>Um padrão para observar:</strong> seus gastos
                        com alimentação aumentaram 12% nas últimas duas semanas.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-7">
                    <div className="rounded-card border border-line bg-white p-6 shadow-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-extrabold">
                            Próximos compromissos
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            Seu calendário fiscal
                          </p>
                        </div>
                        <Button
                          onClick={() => setActive("Calendário fiscal")}
                          aria-label="Abrir calendário completo"
                          className="rounded-xl bg-primary-soft p-2.5 text-primary hover:bg-primary hover:text-white"
                        >
                          <Icon name="calendar" />
                        </Button>
                      </div>
                      <div className="mt-6 space-y-3">
                        <Button
                          onClick={() =>
                            setActiveModal(
                              fiscalDetails["Carnê-Leão — setembro"],
                            )
                          }
                          aria-haspopup="dialog"
                          className="flex w-full items-center gap-4 rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-primary-soft"
                        >
                          <div className="min-w-12 rounded-lg bg-coral-soft px-2 py-2 text-center text-coral">
                            <p className="text-xs font-bold uppercase">Out</p>
                            <p className="text-lg font-extrabold leading-none">
                              30
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              Carnê-Leão — setembro
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Confira se esta obrigação se aplica
                            </p>
                          </div>
                          <span className="rounded-full bg-coral-soft px-2 py-1 text-xs font-bold text-coral">
                            Próximo
                          </span>
                        </Button>
                        <Button
                          onClick={() =>
                            setActiveModal(fiscalDetails["DAS — MEI outubro"])
                          }
                          aria-haspopup="dialog"
                          className="flex w-full items-center gap-4 rounded-xl border border-line p-3 text-left hover:border-primary/30 hover:bg-primary-soft"
                        >
                          <div className="min-w-12 rounded-lg bg-blue-soft px-2 py-2 text-center text-blue">
                            <p className="text-xs font-bold uppercase">Nov</p>
                            <p className="text-lg font-extrabold leading-none">
                              20
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              DAS — MEI outubro
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              Guia mensal do microempreendedor
                            </p>
                          </div>
                          <Icon name="arrow" size="size-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => setActive("Calendário fiscal")}
                        className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-primary hover:gap-3"
                      >
                        Ver calendário completo{" "}
                        <Icon name="arrow" size="size-4" />
                      </Button>
                    </div>
                  </div>
                </section>

                <section className="mt-7 grid gap-7 xl:grid-cols-[1.55fr_1fr]">
                  <div className="overflow-hidden rounded-card bg-learning shadow-card">
                    <div className="grid min-h-60 md:grid-cols-[1.25fr_0.75fr]">
                      <div className="p-7 md:p-8">
                        <span className="inline-flex rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">
                          Dica do Buddy
                        </span>
                        <p className="mt-5 max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-ink">
                          Reserva de emergência: por onde começar?
                        </p>
                        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
                          Descubra como construir sua segurança financeira aos
                          poucos, mesmo começando com pouco.
                        </p>
                        <Button
                          onClick={() => setActiveModal(learningCard)}
                          aria-haspopup="dialog"
                          className="mt-6 flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white hover:bg-primary"
                        >
                          Ler card de hoje <Icon name="arrow" size="size-4" />
                        </Button>
                      </div>
                      <div className="relative hidden overflow-hidden bg-hero md:block">
                        <img
                          className="brand-mascot absolute inset-0 size-full object-cover"
                          src={mascotImage}
                          alt="Mascote capivara do Money Buddy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-mascot-fade p-4 pt-10">
                          <Button
                            onClick={() => setImageOpen(true)}
                            aria-haspopup="dialog"
                            className="w-full rounded-xl border border-white bg-hero px-3 py-2 text-xs font-bold text-white"
                          >
                            Ampliar imagem do Buddy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-card border border-line bg-white p-6 shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-xl bg-green-soft text-green">
                        <Icon name="shield" />
                      </div>
                      <div>
                        <p className="text-lg font-extrabold">
                          Acessibilidade e proteção
                        </p>
                        <p className="text-xs text-muted">
                          Você está no controle
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 divide-y divide-line">
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <Icon name="audio" />
                          <div>
                            <p className="text-sm font-bold">Audiodescrição</p>
                            <p className="text-xs text-muted">
                              Narrar conteúdos da tela
                            </p>
                          </div>
                        </div>
                        <Toggle
                          on={preferences.audio}
                          setOn={(value) => updatePreference("audio", value)}
                          label="Ativar audiodescrição"
                        />
                      </div>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-3">
                          <Icon name="hands" />
                          <div>
                            <p className="text-sm font-bold">
                              Janela de Libras
                            </p>
                            <p className="text-xs text-muted">
                              Intérprete virtual
                            </p>
                          </div>
                        </div>
                        <Toggle
                          on={preferences.libras}
                          setOn={(value) => updatePreference("libras", value)}
                          label="Ativar janela de Libras"
                        />
                      </div>
                    </div>
                    <Button className="mt-2 flex w-full items-center justify-between rounded-xl bg-surface p-4 text-left hover:bg-primary-soft">
                      <span className="flex items-center gap-3 text-sm font-bold">
                        <Icon name="lock" /> Como protegemos seus dados
                      </span>
                      <Icon name="arrow" size="size-4" />
                    </Button>
                    <p className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-green">
                      <Icon name="check" size="size-4" /> Criptografia de ponta
                      a ponta ativa
                    </p>
                  </div>
                </section>
              </>
            ) : active === "Gastos" ? (
              <ExpenseDashboard
                categoryTotals={categoryTotals}
                records={expenseRecords}
                onAddExpense={openExpenseModal}
              />
            ) : (
              <ExplorerPage section={active} onOpenInfo={setActiveModal} />
            )}
          </main>
        </div>
      </div>
      {activeModal && (
        <InfoModal
          content={activeModal}
          marked={marked}
          toggleMark={toggleMark}
          onClose={() => setActiveModal(null)}
        />
      )}
      {expenseModalOpen && (
        <AddExpenseModal
          initialCategory={expenseModalCategory}
          onClose={() => {
            setExpenseModalOpen(false)
            setExpenseModalCategory(undefined)
          }}
          onAdd={addExpense}
        />
      )}
      {imageOpen && (
        <ImageZoom src={mascotImage} onClose={() => setImageOpen(false)} />
      )}
      {preferences.libras && <VLibrasWidget />}
    </div>
  )
}

function App() {
  const [preferences, setPreferences] =
    useState<AccessibilityPreferences>(defaultPreferences)
  return (
    <AccessibilityFeedback
      voice={preferences.audio}
      sound={preferences.sound}
      vibration={preferences.vibration}
    >
      <MoneyBuddy preferences={preferences} setPreferences={setPreferences} />
    </AccessibilityFeedback>
  )
}

export default App
