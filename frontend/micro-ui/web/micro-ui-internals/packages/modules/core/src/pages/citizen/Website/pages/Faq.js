import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { PgAccordion, PgCta, PgEmpty, PgHead, PgSearch, PgTabs, Reveal } from "../components";
import { ROUTES } from "../config";
import faqData from "../data/faq";

const Faq = () => {
  const { t } = useTranslation();
  const history = useHistory();
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
      <div className="PgPage">
        <div className="PgToolbar">
          <PgTabs
            label={tt("SITE_FAQ_TITLE", "Frequently Asked Questions")}
            value={cat}
            onChange={setCat}
            tabs={[{ id: "all", label: tt("SITE_FAQ_ALL", "All") }, ...faqData.map((g) => ({ id: g.id, label: tt(`SITE_FAQ_${g.id.toUpperCase()}`, g.title), count: g.items.length }))]}
          />
          <PgSearch value={q} onChange={setQ} placeholder={tt("SITE_FAQ_SEARCH", "Search questions")} count={total} />
        </div>

        {groups.length === 0 ? (
          <PgEmpty icon="search" title={tt("SITE_FAQ_NONE", "No matching questions")} text={tt("SITE_FAQ_NONE_T", "Try different words, or contact the helpline.")} />
        ) : (
          groups.map((g) => (
            <Reveal key={g.id} className="PgBlock" aria-labelledby={`faq-h-${g.id}`}>
              <PgHead title={tt(`SITE_FAQ_${g.id.toUpperCase()}`, g.title)} id={`faq-h-${g.id}`} />
              <div className="PgAccList">
                {g.items.map((it) => (
                  <PgAccordion key={it.key} id={it.key} question={it.q} open={open === it.key} onToggle={() => setOpen(open === it.key ? null : it.key)}>
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
                  </PgAccordion>
                ))}
              </div>
            </Reveal>
          ))
        )}

        <PgCta title={tt("SITE_FAQ_CTA", "Still need help?")} text={tt("SITE_FAQ_CTA_T", "Our helpline team is available Monday to Saturday, 9:30 AM to 6:00 PM.")}>
          <button type="button" className="LandingBtn LandingBtn--primary" onClick={() => history.push(ROUTES.contact)}>
            {tt("SITE_NAV_CONTACT", "Contact Us")}
          </button>
        </PgCta>
      </div>
    </SiteShell>
  );
};

export default Faq;
