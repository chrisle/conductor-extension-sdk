/**
 * @conductor/extension-sdk
 *
 * Type definitions and utilities for building Conductor extensions.
 * External extensions import these types to get autocomplete and type safety.
 */

import type { ComponentType } from 'react'

/** Standard props every tab component receives from the host */
export interface TabProps {
  tabId: string
  groupId: string
  isActive: boolean
  tab: {
    id: string
    type: string
    title: string
    filePath?: string
    url?: string
    isDirty?: boolean
    isThinking?: boolean
    content?: string
    initialCommand?: string
  }
}

/** A tab type registration from an extension */
export interface TabRegistration {
  type: string
  label: string
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  component: ComponentType<TabProps>
  fileExtensions?: string[]
}

/** An item an extension contributes to the "new tab" dropdown menu */
export interface NewTabMenuItem {
  label: string
  icon: ComponentType<{ className?: string }>
  iconClassName?: string
  action: (groupId: string) => void
  separator?: 'before' | 'after'
}

/**
 * A Claude Code skill bundled with an extension.
 * Installed to ~/.claude/skills/conductor-<extensionId>-<slug>/SKILL.md on first run.
 */
export interface SkillDefinition {
  /** Short slug — combined with the extension ID to form the installed name */
  slug: string
  /** Full SKILL.md content including frontmatter */
  content: string
}

/** The extension definition — the default export of every extension bundle */
export interface Extension {
  id: string
  name: string
  description?: string
  version?: string
  icon?: ComponentType<{ className?: string }>
  sidebar?: ComponentType<{ groupId: string }>
  /** Optional settings panel rendered inside the Settings sidebar */
  settingsPanel?: ComponentType
  /** Optional config panel shown when the user clicks "Configure" in the Extensions list */
  configPanel?: ComponentType
  tabs?: TabRegistration[]
  newTabMenuItems?: NewTabMenuItem[]
  onActivate?: () => void
  /** Claude Code skills to install for the user on first run */
  skills?: SkillDefinition[]
}

/**
 * Helper to define an extension with full type inference.
 *
 * Usage:
 * ```ts
 * export default defineExtension({
 *   id: 'my-extension',
 *   name: 'My Extension',
 *   tabs: [...]
 * })
 * ```
 */
export function defineExtension(extension: Extension): Extension {
  return extension
}
