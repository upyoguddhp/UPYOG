import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { Accordion, EmptyState, FilterBar, Tabs } from "../components";
import faqData from "../data/faq";

const Faq = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState("general-0");

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return faqData
      .filter((g) => cat === "all" || g.id === cat)
      .map((g) => ({
        ...g,
        items: g.items
          .map((it, idx) => ({ ...it, key: `${g.id}-${idx}` }))
          .filter((it) => !term || `${it.q} ${it.a.join(" ")} ${(it.list || []).join(" ")}`.toLowerCase().includes(term)),
      }))
      .filter((g) => g.items.length > 0);
  }, [cat, q]);

  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <SiteShell
      activeId="faq"
      title={tt("SITE_FAQ_TITLE", "Frequently Asked Questions")}
      subtitle={tt("SITE_FAQ_SUB", "Quick answers about the portal, services and support.")}
      icon={<Icon name="help" size={30} />}
    >
      <Tabs
        value={cat}
        onChange={setCat}
        tabs={[{ id: "all", label: tt("SITE_FAQ_ALL", "All") }, ...faqData.map((g) => ({ id: g.id, label: tt(`SITE_FAQ_${g.id.toUpperCase()}`, g.title) }))]}
      />
      <FilterBar value={q} onChange={setQ} placeholder={tt("SITE_FAQ_SEARCH", "Search questions")} count={total} />
      {groups.length === 0 ? (
        <EmptyState icon="search" title={tt("SITE_FAQ_NONE", "No matching questions")} text={tt("SITE_FAQ_NONE_T", "Try different words, or contact the helpline.")} />
      ) : (
        groups.map((g) => (
          <section key={g.id} className="FaqGroup">
            <h2 className="SiteSection__title">{tt(`SITE_FAQ_${g.id.toUpperCase()}`, g.title)}</h2>
            {g.items.map((it) => (
              <Accordion key={it.key} id={it.key} question={it.q} open={open === it.key} onToggle={() => setOpen(open === it.key ? null : it.key)}>
                {it.a.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {it.list ? (
                  <ul>
                    {it.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                ) : null}
              </Accordion>
            ))}
          </section>
        ))
      )}
    </SiteShell>
  );
};

export default Faq;
