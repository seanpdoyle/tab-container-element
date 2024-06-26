const HTMLElement = globalThis.HTMLElement || (null as unknown as (typeof window)['HTMLElement'])
const manualSlotsSupported = 'assign' in (globalThis.HTMLSlotElement?.prototype || {})

export class TabContainerChangeEvent extends Event {
  constructor(
    type: string,
    {tabIndex, tab, panel, ...init}: EventInit & {tabIndex?: number; tab?: Element; panel?: Element},
  ) {
    super(type, init)
    this.#tab = tab || null
    this.#tabIndex = tabIndex || null
    this.#panel = panel || null
  }

  get detail() {
    // eslint-disable-next-line no-console
    console.warn('TabContainerElement.detail is deprecated, please use .panel instead')
    return {relatedTarget: this.#panel}
  }

  #tabIndex: number | null = null
  get tabIndex(): number | null {
    return this.#tabIndex
  }

  #panel: Element | null = null
  get panel(): Element | null {
    return this.#panel
  }

  #tab: Element | null = null
  get tab(): Element | null {
    return this.#tab
  }
}

export class TabContainerElement extends HTMLElement {
  static define(tag = 'tab-container', registry = customElements) {
    registry.define(tag, this)
    return this
  }

  get onChange() {
    return this.onTabContainerChange
  }

  set onChange(listener: ((event: TabContainerChangeEvent) => void) | null) {
    this.onTabContainerChange = listener
  }

  #onTabContainerChange: ((event: TabContainerChangeEvent) => void) | null = null
  get onTabContainerChange() {
    return this.#onTabContainerChange
  }

  set onTabContainerChange(listener: ((event: TabContainerChangeEvent) => void) | null) {
    if (this.#onTabContainerChange) {
      this.removeEventListener(
        'tab-container-change',
        this.#onTabContainerChange as unknown as EventListenerOrEventListenerObject,
      )
    }
    this.#onTabContainerChange = typeof listener === 'object' || typeof listener === 'function' ? listener : null
    if (typeof listener === 'function') {
      this.addEventListener('tab-container-change', listener as unknown as EventListenerOrEventListenerObject)
    }
  }

  #onTabContainerChanged: ((event: TabContainerChangeEvent) => void) | null = null
  get onTabContainerChanged() {
    return this.#onTabContainerChanged
  }

  set onTabContainerChanged(listener: ((event: TabContainerChangeEvent) => void) | null) {
    if (this.#onTabContainerChanged) {
      this.removeEventListener(
        'tab-container-changed',
        this.#onTabContainerChanged as unknown as EventListenerOrEventListenerObject,
      )
    }
    this.#onTabContainerChanged = typeof listener === 'object' || typeof listener === 'function' ? listener : null
    if (typeof listener === 'function') {
      this.addEventListener('tab-container-changed', listener as unknown as EventListenerOrEventListenerObject)
    }
  }

  get onChanged() {
    return this.onTabContainerChanged
  }

  set onChanged(listener: ((event: TabContainerChangeEvent) => void) | null) {
    this.onTabContainerChanged = listener
  }

  static observedAttributes = ['vertical']

  get #tabList() {
    const wrapper = this.querySelector('[slot=tablist-wrapper],[slot=tablist-tab-wrapper]')
    if (wrapper?.closest(this.tagName) === this) {
      return wrapper.querySelector('[role=tablist]') as HTMLElement
    }
    const slot = this.#tabListSlot
    if (this.#tabListTabWrapper.hasAttribute('role')) {
      return this.#tabListTabWrapper
    } else {
      return slot.assignedNodes()[0] as HTMLElement
    }
  }

  get #tabListWrapper() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="tablist-wrapper"]')!
  }

  get #tabListTabWrapper() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="tablist-tab-wrapper"]')!
  }

  get #beforeTabsSlot() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="before-tabs"]')!
  }

  get #afterTabsSlot() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="after-tabs"]')!
  }

  get #afterPanelsSlot() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="after-panels"]')!
  }

  get #tabListSlot() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="tablist"]')!
  }

  get #panelSlot() {
    return this.shadowRoot!.querySelector<HTMLSlotElement>('slot[part="panel"]')!
  }

  get #tabs() {
    if (this.#tabListTabWrapper.matches('[role=tablist]')) {
      return this.#tabListSlot.assignedNodes() as HTMLElement[]
    }
    return Array.from(this.#tabList?.querySelectorAll<HTMLElement>('[role="tab"]') || []).filter(
      tab => tab instanceof HTMLElement && tab.closest(this.tagName) === this,
    )
  }

  get activeTab() {
    return this.#tabs[this.selectedTabIndex]
  }

  get activePanel() {
    return this.#panelSlot.assignedNodes()[0] as HTMLElement
  }

  get vertical(): boolean {
    return this.#tabList?.getAttribute('aria-orientation') === 'vertical'
  }

  set vertical(isVertical: boolean) {
    const tabList = this.#tabList
    if (tabList && isVertical) {
      tabList.setAttribute('aria-orientation', 'vertical')
    } else {
      tabList.setAttribute('aria-orientation', 'horizontal')
    }
  }

  #setupComplete = false
  #internals!: ElementInternals | null
  connectedCallback(): void {
    this.#internals ||= this.attachInternals ? this.attachInternals() : null
    const shadowRoot = this.shadowRoot || this.attachShadow({mode: 'open', slotAssignment: 'manual'})
    const tabListContainer = document.createElement('slot')
    tabListContainer.style.display = 'flex'
    tabListContainer.setAttribute('part', 'tablist-wrapper')
    tabListContainer.setAttribute('name', 'tablist-wrapper')
    const tabListTabWrapper = document.createElement('slot')
    tabListTabWrapper.setAttribute('part', 'tablist-tab-wrapper')
    tabListTabWrapper.setAttribute('name', 'tablist-tab-wrapper')
    const tabListSlot = document.createElement('slot')
    tabListSlot.setAttribute('part', 'tablist')
    tabListSlot.setAttribute('name', 'tablist')
    tabListTabWrapper.append(tabListSlot)
    const panelSlot = document.createElement('slot')
    panelSlot.setAttribute('part', 'panel')
    panelSlot.setAttribute('name', 'panel')
    panelSlot.setAttribute('role', 'presentation')
    const beforeTabSlot = document.createElement('slot')
    beforeTabSlot.setAttribute('part', 'before-tabs')
    beforeTabSlot.setAttribute('name', 'before-tabs')
    const afterTabSlot = document.createElement('slot')
    afterTabSlot.setAttribute('part', 'after-tabs')
    afterTabSlot.setAttribute('name', 'after-tabs')
    tabListContainer.append(beforeTabSlot, tabListTabWrapper, afterTabSlot)
    const afterSlot = document.createElement('slot')
    afterSlot.setAttribute('part', 'after-panels')
    afterSlot.setAttribute('name', 'after-panels')
    shadowRoot.replaceChildren(tabListContainer, panelSlot, afterSlot)

    if (this.#internals && 'role' in this.#internals) {
      this.#internals.role = 'presentation'
    } else {
      this.setAttribute('role', 'presentation')
    }

    this.addEventListener('keydown', this)
    this.addEventListener('click', this)

    this.selectTab(-1)
    this.#setupComplete = true
  }

  attributeChangedCallback(name: string) {
    if (!this.isConnected || !this.shadowRoot) return
    if (name === 'vertical') {
      this.vertical = this.hasAttribute('vertical')
    }
  }

  handleEvent(event: Event) {
    if (event.type === 'click') return this.#handleClick(event as MouseEvent)
    if (event.type === 'keydown') return this.#handleKeydown(event as KeyboardEvent)
  }

  #handleKeydown(event: KeyboardEvent) {
    const tab = (event.target as HTMLElement)?.closest?.('[role="tab"]')
    if (!tab) return
    const tabs = this.#tabs
    if (!tabs.includes(tab as HTMLElement)) return

    const currentIndex = this.selectedTabIndex
    const vertical = tab.closest('[role="tablist"]')?.getAttribute('aria-orientation') === 'vertical'
    const prevTab = event.code === 'ArrowLeft' || (vertical && event.code === 'ArrowUp')
    const nextTab = event.code === 'ArrowRight' || (vertical && event.code === 'ArrowDown')

    if (nextTab) {
      let index = currentIndex + 1
      if (index >= tabs.length) index = 0
      this.selectTab(index)
    } else if (prevTab) {
      let index = currentIndex - 1
      if (index < 0) index = tabs.length - 1
      this.selectTab(index)
    } else if (event.code === 'Home') {
      this.selectTab(0)
      event.preventDefault()
    } else if (event.code === 'End') {
      this.selectTab(tabs.length - 1)
      event.preventDefault()
    }
  }

  #handleClick(event: MouseEvent) {
    const tab = (event.target as HTMLElement)?.closest?.('[role=tab]')
    if (!tab) return
    const tabs = this.#tabs
    const index = tabs.indexOf(tab as HTMLElement)
    if (index >= 0) this.selectTab(index)
  }

  #reflectAttributeToShadow(name: string, node: Element) {
    if (this.hasAttribute(name)) {
      node.setAttribute(name, this.getAttribute(name)!)
      this.removeAttribute(name)
    }
  }

  get selectedTabIndex(): number {
    return this.#tabs.findIndex(el => el.matches('[aria-selected=true]'))
  }

  set selectedTabIndex(i: number) {
    this.selectTab(i)
  }

  get defaultTabIndex(): number {
    return Number(this.getAttribute('default-tab') || -1)
  }

  set defaultTabIndex(index: number) {
    this.setAttribute('default-tab', String(index))
  }

  selectTab(index: number): void {
    if (!this.#setupComplete) {
      const tabListSlot = this.#tabListSlot
      const tabListWrapper = this.#tabListWrapper
      const tabListTabWrapper = this.#tabListTabWrapper
      const customTabList = this.querySelector('[role=tablist]')
      const customTabListWrapper = this.querySelector('[slot=tablist-wrapper]')
      const customTabListTabWrapper = this.querySelector('[slot=tablist-tab-wrapper]')
      if (customTabListWrapper && customTabListWrapper.closest(this.tagName) === this) {
        if (manualSlotsSupported) {
          tabListWrapper.assign(customTabListWrapper)
        } else {
          customTabListWrapper.setAttribute('slot', 'tablist-wrapper')
        }
      } else if (customTabListTabWrapper && customTabListTabWrapper.closest(this.tagName) === this) {
        if (manualSlotsSupported) {
          tabListTabWrapper.assign(customTabListTabWrapper)
        } else {
          customTabListTabWrapper.setAttribute('slot', 'tablist-tab-wrapper')
        }
      } else if (customTabList && customTabList.closest(this.tagName) === this) {
        if (manualSlotsSupported) {
          tabListSlot.assign(customTabList)
        } else {
          customTabList.setAttribute('slot', 'tablist')
        }
      } else {
        this.#tabListTabWrapper.role = 'tablist'
        if (manualSlotsSupported) {
          tabListSlot.assign(...[...this.children].filter(e => e.matches('[role=tab]')))
        } else {
          for (const e of this.children) {
            if (e.matches('[role=tab]')) e.setAttribute('slot', 'tablist')
          }
        }
      }
      const tabList = this.#tabList
      this.#reflectAttributeToShadow('aria-description', tabList)
      this.#reflectAttributeToShadow('aria-label', tabList)
      if (this.vertical) {
        this.#tabList.setAttribute('aria-orientation', 'vertical')
      }
      const bringsOwnWrapper = this.querySelector('[slot=tablist-wrapper]')?.closest(this.tagName) === this
      if (!bringsOwnWrapper) {
        const beforeSlotted: Element[] = []
        const afterTabSlotted: Element[] = []
        const afterSlotted: Element[] = []
        let autoSlotted = beforeSlotted
        for (const child of this.children) {
          if (
            child.getAttribute('role') === 'tab' ||
            child.getAttribute('role') === 'tablist' ||
            child.getAttribute('slot') === 'tablist-tab-wrapper'
          ) {
            autoSlotted = afterTabSlotted
            continue
          }
          if (child.getAttribute('role') === 'tabpanel') {
            autoSlotted = afterSlotted
            continue
          }
          if (child.getAttribute('slot') === 'before-tabs') {
            beforeSlotted.push(child)
          } else if (child.getAttribute('slot') === 'after-tabs') {
            afterTabSlotted.push(child)
          } else {
            autoSlotted.push(child)
          }
        }
        if (manualSlotsSupported) {
          this.#beforeTabsSlot.assign(...beforeSlotted)
          this.#afterTabsSlot.assign(...afterTabSlotted)
          this.#afterPanelsSlot.assign(...afterSlotted)
        } else {
          for (const el of beforeSlotted) el.setAttribute('slot', 'before-tabs')
          for (const el of afterTabSlotted) el.setAttribute('slot', 'after-tabs')
          for (const el of afterSlotted) el.setAttribute('slot', 'after-panels')
        }
      }
      const defaultTab = this.defaultTabIndex
      const defaultIndex = defaultTab >= 0 ? defaultTab : this.selectedTabIndex
      index = index >= 0 ? index : Math.max(0, defaultIndex)
    }

    const tabs = this.#tabs
    const panels = Array.from(this.querySelectorAll<HTMLElement>('[role="tabpanel"]')).filter(
      panel => panel.closest(this.tagName) === this,
    )

    /**
     * Out of bounds index
     */
    if (index > tabs.length - 1) {
      throw new RangeError(`Index "${index}" out of bounds`)
    }

    const selectedTab = tabs[index]
    const selectedPanel = panels[index]

    if (this.#setupComplete) {
      const cancelled = !this.dispatchEvent(
        new TabContainerChangeEvent('tab-container-change', {
          tabIndex: index,
          bubbles: true,
          cancelable: true,
          tab: selectedTab,
          panel: selectedPanel,
        }),
      )
      if (cancelled) return
    }

    for (const tab of tabs) {
      tab.setAttribute('aria-selected', 'false')
      tab.setAttribute('tabindex', '-1')
    }
    for (const panel of panels) {
      if (!panel.hasAttribute('tabindex') && !panel.hasAttribute('data-tab-container-no-tabstop')) {
        panel.setAttribute('tabindex', '0')
      }
      if (!manualSlotsSupported && panel.hasAttribute('slot')) {
        panel.removeAttribute('slot')
      }
    }

    selectedTab.setAttribute('aria-selected', 'true')
    selectedTab.setAttribute('tabindex', '0')
    if (manualSlotsSupported) {
      this.#panelSlot.assign(selectedPanel)
    } else {
      selectedPanel.setAttribute('slot', 'panel')
    }
    selectedPanel.hidden = false

    if (this.#setupComplete) {
      selectedTab.focus()
      this.dispatchEvent(
        new TabContainerChangeEvent('tab-container-changed', {
          tabIndex: index,
          bubbles: true,
          tab: selectedTab,
          panel: selectedPanel,
        }),
      )
    }
  }
}
