import { Link } from "react-router-dom";
import type { Item } from "../api";
import { Avatar, Chip, Icon, formatNum } from "./ui";

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Link to={"/item/" + item.slug} className="card" aria-label={`${item.name} — ${item.tagline}`}>
      <div className="card-top">
        <Chip category={item.category} />
        {item.featured ? (
          <span className="featured-star">
            <Icon name="star" size={11} /> Featured
          </span>
        ) : item.model ? (
          <span className="featured-star" style={{ color: "var(--gold)", opacity: 0.9 }} title="Live model answering this agent">
            <Icon name="spark" size={10} /> {item.model}
          </span>
        ) : item.runtime ? (
          <span className="featured-star" style={{ color: "var(--gold)", opacity: 0.8 }}>
            <Icon name="play" size={10} /> Run in app
          </span>
        ) : null}
      </div>
      <div className="card-name">{item.name}</div>
      <div className="card-tag">{item.tagline}</div>
      <div className="card-tags">
        {item.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">{t}</span>
        ))}
      </div>
      <div className="card-foot">
        <Avatar name={item.author.name} hue={item.author.hue} />
        <div>
          <div className="card-author" style={{ color: "var(--muted)", fontSize: 12 }}>{item.author.name}</div>
          <div className="card-author" style={{ fontSize: 10.5 }}>{item.author.role}</div>
        </div>
        <div className="card-meta">
          {item.rating.count > 0 && (
            <span className="rating-inline">
              <Icon name="star" size={11} />
              {item.rating.avg.toFixed(1)}
            </span>
          )}
          <span className="meta-item" title={`${item.installs.toLocaleString()} installs`}>
            <Icon name="download" size={11} />
            {formatNum(item.installs)}
          </span>
        </div>
      </div>
    </Link>
  );
}
