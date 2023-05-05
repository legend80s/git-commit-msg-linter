export interface InstallOptions {
  silent?: boolean
}

export function install(options?: InstallOptions): void

export function uninstall(): void
