import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setInterest } from "../engine/tripContext";
import { categories } from "../data/categories";
import "./CategoryGrid.css";

function CategoryGrid() {
  const [hovered, setHovered] = useState<string | null>(null);
  const navigate = useNavigate();

  const hoveredCategory = categories.find((c) => c.experienceId === hovered);

  return (
    <div className="category-grid">
      {categories.map((category) => (
        <button
          key={category.experienceId}
          onMouseEnter={() => setHovered(category.experienceId)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => {
            setInterest(category.experienceId);
            navigate(`/categoria/${category.experienceId}`);
          }}
        >
          <span>{category.icon}</span>
          <br />
          {category.title}
        </button>
      ))}

      {hoveredCategory && (
        <div className="nori-grid-preview">
          ✦ {hoveredCategory.message}
        </div>
      )}
    </div>
  );
}

export default CategoryGrid;