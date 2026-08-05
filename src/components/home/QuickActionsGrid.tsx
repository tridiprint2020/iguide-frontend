import QuickActionCard from "./QuickActionCard";

type QuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image?: string;
  accent?: string;
  variant?: "photo" | "map";
  onClick: () => void;
};

type Props = {
  actions: QuickAction[];
};

function QuickActionsGrid({
  actions,
}: Props) {
  return (
    <section
      aria-label="Acciones rápidas"
      style={{
        width: "100%",
      }}
    >
      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",

          gap: "10px",

          width: "100%",

          boxSizing: "border-box",
        }}
      >
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            subtitle={action.subtitle}
            icon={action.icon}
            image={action.image}
            accent={action.accent}
            variant={action.variant}
            onClick={action.onClick}
          />
        ))}
      </div>
    </section>
  );
}

export default QuickActionsGrid;