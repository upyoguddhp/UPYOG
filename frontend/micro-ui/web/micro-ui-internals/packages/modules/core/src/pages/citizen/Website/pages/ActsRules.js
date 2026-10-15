import React from "react";
import { useTranslation } from "react-i18next";
import SiteShell from "../SiteShell";
import Icon from "../../Home/Landing/Icons";
import { DownloadButton, Section } from "../components";
import { documentUrl } from "../siteNav";
import actsData from "../data/acts";
import byelawsData from "../data/byelaws";

/** Act → amendments timeline. */
const ActBlock = ({ group, tt }) => (
  <Section title={group.group}>
    {group.items.map((act) => (
      <article className="ActCard" key={act.file}>
        <header className="ActCard__head">
          <span className="ActCard__icon"><Icon name="law" size={26} /></span>
          <div>
            <small>{act.label}</small>
            <h3>{act.title}</h3>
          </div>
          <DownloadButton href={documentUrl(act.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
        </header>
        {act.children.length > 0 && (
          <ol className="ActCard__timeline">
            {act.children.map((c) => (
              <li key={c.file}>
                <span className="ActCard__dot" aria-hidden="true" />
                <div>
                  <b>{c.label || tt("SITE_AMENDMENT", "Amendment")}</b>
                  <span>{c.title}</span>
                </div>
                <DownloadButton ghost href={documentUrl(c.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
              </li>
            ))}
          </ol>
        )}
      </article>
    ))}
  </Section>
);

export const Acts = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="acts-list"
      title={tt("SITE_ACTS_TITLE", "Acts")}
      subtitle={tt("SITE_ACTS_SUB", "Municipal Acts of Himachal Pradesh with their amendments.")}
      icon={<Icon name="law" size={30} />}
    >
      {actsData.map((g) => (
        <ActBlock key={g.group} group={g} tt={tt} />
      ))}
    </SiteShell>
  );
};

export const ByeLaws = () => {
  const { t } = useTranslation();
  const tt = (k, d) => t(k, { defaultValue: d });
  return (
    <SiteShell
      activeId="byelaws"
      title={tt("SITE_BYELAWS_TITLE", "ByeLaws")}
      subtitle={tt("SITE_BYELAWS_SUB", "State-level and ULB-specific byelaws.")}
      icon={<Icon name="book" size={30} />}
    >
      <Section title={tt("SITE_BYELAWS_GENERAL", "State-level byelaws")}>
        <div className="SiteGrid SiteGrid--2">
          {byelawsData.general.map((b) => (
            <article className="SiteDoc" key={b.file}>
              <span className="SiteDoc__icon"><Icon name="doc" size={26} /></span>
              <div className="SiteDoc__body">
                <small>{b.label}</small>
                <h3>{b.title}</h3>
              </div>
              <DownloadButton href={documentUrl(b.file)} label={tt("SITE_DOWNLOAD_PDF", "Download PDF")} />
            </article>
          ))}
        </div>
      </Section>

      <Section title={tt("SITE_BYELAWS_ULB", "ULB-wise byelaws")} intro={tt("SITE_BYELAWS_ULB_T", "Byelaws adopted by individual urban local bodies.")}>
        <div className="SiteGrid SiteGrid--3">
          {byelawsData.ulb.map((u) => (
            <article className="UlbCard" key={u.label}>
              <header>
                <span className="UlbCard__icon"><Icon name="building" size={24} /></span>
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
      </Section>
    </SiteShell>
  );
};
