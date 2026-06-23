import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Captura erros de renderacao em qualquer parte da arvore e exibe um fallback
 * amigavel em vez de tela branca. Protege principalmente contra crashes de
 * `removeChild`/`insertBefore` causados por traducao automatica do navegador
 * (Google Translate) mutando os nos de texto por fora do React.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary capturou um erro:", error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Algo deu errado
          </h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Ocorreu um erro ao carregar a tela. Por favor, recarregue a pagina
            para continuar.
          </p>
          <button
            onClick={this.handleReload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Recarregar pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
