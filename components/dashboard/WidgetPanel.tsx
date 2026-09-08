import TradingViewWidget from "@/components/TradingViewWidget";
import { Panel } from "@/components/system";

interface WidgetPanelProps {
  title: string;
  description?: string;
  /** Full TradingView embed script URL — passed straight through, unchanged. */
  scriptUrl: string;
  config: Record<string, unknown>;
  height?: number;
  /** Stagger index for the entrance transition. */
  index?: number;
  className?: string;
  widgetClassName?: string;
}

/**
 * A TradingView embed dressed as a design-system panel. The widget itself
 * (script URL, config object, height) is handed through untouched — this is
 * presentation only.
 */
export function WidgetPanel({
  title,
  description,
  scriptUrl,
  config,
  height = 600,
  index = 0,
  className,
  widgetClassName,
}: WidgetPanelProps) {
  return (
    <Panel
      title={title}
      description={description}
      flush
      padding="sm"
      className={`app-enter ${className ?? ""}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <TradingViewWidget
        scriptUrl={scriptUrl}
        config={config}
        height={height}
        className={widgetClassName}
      />
    </Panel>
  );
}

export default WidgetPanel;
