import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAction, PgDoc, PgEmpty, PgHead, PgSearch, Reveal, toneOf } from "../components";
import { documentUrl } from "../siteNav";
import actsData from "../data/acts";
import byelawsData from "../data/byelaws";

/** One Act with its amendments: the amendments open and close so long lists stay compact. */
const ActCard = ({ act, tt, tone }) => {
  const [open, setOpen] = useState(false);
  const n = act.children.length;
  return (
    <article className={`PgAct PgAct--${tone}`}>
      <header className="PgAct__head">
        <span className="PgAct__icon" aria-hidden="true"><Icon name="law" size={26} /></span>
        <div className="PgAct__title">
          <small>{act.label}</small>
          <h3>{act.title}</h3>
        </div>
        <PgAction href={documentUrl(act.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
      </header>
      {n > 0 && (
        <React.Fragment>
          <button type="button" className="PgAct__toggle" aria-expanded={open} aria-controls={`act-${act.file}`} onClick={() => setOpen(!open)}>
            <span>{tt("SITE_AMENDMENTS", "Amendments")} <b>{n}</b></span>
            <span className="PgAct__chev" aria-hidden="true" />
          </button>
          <div id={`act-${act.file}`} className={`PgAct__panel${open ? " is-open" : ""}`}>
            <ol className="PgAct__timeline">
              {act.children.map((c) => (
                <li key={c.file}>
                  <span className="PgAct__dot" aria-hidden="true" />
                  <div>
                    <b>{c.label || tt("SITE_AMENDMENT", "Amendment")}</b>
                    <span>{c.title}</span>
                  </div>
                  <PgAction ghost href={documentUrl(c.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
                </li>
              ))}
            </ol>
          </div>
        </React.Fragment>
      )}
    </article>
  );
};

export const Acts = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return actsData
      .map((g) => ({ ...g, items: g.items.filter((a) => !term || `${a.title} ${a.label} ${a.children.map((c) => c.title).join(" ")}`.toLowerCase().includes(term)) }))
      .filter((g) => g.items.length);
  }, [q]);
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  let k = 0;
  return (
    <SiteShell
      activeId="acts-list"
      title={tt("SITE_ACTS_TITLE", "Acts")}
      subtitle={tt("SITE_ACTS_SUB", "Municipal Acts of Himachal Pradesh with their amendments.")}
      icon={<Icon name="law" size={30} />}
    >
      <div className="PgPage">
        <div className="PgToolbar">
          <PgSearch value={q} onChange={setQ} placeholder={tt("SITE_ACTS_SEARCH", "Search acts and amendments")} count={total} />
        </div>
        {groups.length === 0 ? (
          <PgEmpty icon="search" title={tt("SITE_DOCS_EMPTY", "No documents found")} text={tt("SITE_DOCS_EMPTY_T", "Try a different search, or check back later.")} />
        ) : (
          groups.map((g, gi) => (
            <Reveal key={g.group} className="PgBlock" aria-labelledby={`acts-h-${gi}`}>
              <PgHead title={g.group} id={`acts-h-${gi}`} />
              <div className="PgActList">
                {g.items.map((act) => (
                  <ActCard key={act.file} act={act} tt={tt} tone={toneOf(k++)} />
                ))}
              </div>
            </Reveal>
          ))
        )}
      </div>
    </SiteShell>
  );
};

export const ByeLaws = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const general = byelawsData.general.filter((b) => !term || `${b.title} ${b.label}`.toLowerCase().includes(term));
  const ulbs = byelawsData.ulb.filter((u) => !term || `${u.label} ${u.title} ${u.children.map((c) => c.title).join(" ")}`.toLowerCase().includes(term));
  return (
    <SiteShell
      activeId="byelaws"
      title={tt("SITE_BYELAWS_TITLE", "ByeLaws")}
      subtitle={tt("SITE_BYELAWS_SUB", "State-level and ULB-specific byelaws.")}
      icon={<Icon name="book" size={30} />}
    >
      <div className="PgPage">
        <div className="PgToolbar">
          <PgSearch value={q} onChange={setQ} placeholder={tt("SITE_BYELAWS_SEARCH", "Search byelaws or a ULB")} count={general.length + ulbs.length} />
        </div>

        {general.length > 0 && (
          <Reveal className="PgBlock" aria-labelledby="bye-general">
            <PgHead id="bye-general" eyebrow={tt("SITE_STATE", "State level")} title={tt("SITE_BYELAWS_GENERAL", "State-level byelaws")} />
            <div className="PgDocGrid">
              {general.map((b, i) => (
                <PgDoc key={b.file} index={i + 1} icon="law" title={b.title} description={b.label} actions={<PgAction href={documentUrl(b.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />} />
              ))}
            </div>
          </Reveal>
        )}

        {ulbs.length > 0 && (
          <Reveal className="PgBlock" aria-labelledby="bye-ulb">
            <PgHead id="bye-ulb" eyebrow={tt("SITE_ULB", "Urban local bodies")} title={tt("SITE_BYELAWS_ULB", "ULB-wise byelaws")} intro={tt("SITE_BYELAWS_ULB_T", "Byelaws adopted by individual urban local bodies.")} />
            <div className="PgUlbGrid">
              {ulbs.map((u, i) => (
                <article className={`PgUlb PgUlb--${toneOf(i)}`} key={u.label}>
                  <header>
                    <span aria-hidden="true"><Icon name="building" size={22} /></span>
                    <h3>{u.label}</h3>
                  </header>
                  <ul>
                    {[{ title: u.title, file: u.file }, ...u.children].map((d) => (
                      <li key={d.file}>
                        <span>{d.title}</span>
                        <a href={documentUrl(d.file)} target="_blank" rel="noopener noreferrer" aria-label={`${tt("SITE_DOWNLOAD_PDF", "Download PDF")}: ${d.title}`}>
                          <Icon name="download" size={20} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Reveal>
        )}

        {general.length + ulbs.length === 0 && (
          <PgEmpty icon="search" title={tt("SITE_DOCS_EMPTY", "No documents found")} text={tt("SITE_DOCS_EMPTY_T", "Try a different search, or check back later.")} />
        )}
      </div>
    </SiteShell>
  );
};
