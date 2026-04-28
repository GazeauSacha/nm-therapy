        <section className="pricing" id="tarifs">
          <div className="reveal">
            <p className="eyebrow eyebrowCenter">{t("pricing.eyebrow")}</p>
            <h2 className="sectionTitle">
              {t("pricing.title")} <em>{t("pricing.title_em")}</em>{" "}
              {t("pricing.title_2")}
            </h2>
            <p
              className="text"
              style={{ maxWidth: "50ch", margin: "0 auto 3rem" }}
            >
              {t("pricing.subtitle")}
            </p>
          </div>
          <div className="pricingCards reveal">
            {offers.map((o: any) => (
              <div
                key={o.id}
                className={`pricingCard${o.featured ? " pricingFeatured" : ""}`}
              >
                <p className="pricingLabel">{nlField(o, "label")}</p>
                <div className="pricingPrice">
                  {nlField(o, "price") || o.price}
                </div>
                <p className="pricingDetail">{nlField(o, "detail")}</p>
                <p className="pricingNote">{nlField(o, "note")}</p>
                <button
                  className={
                    o.featured ? "btnPricingFilled" : "btnPricingOutline"
                  }
                  onClick={() => scrollTo("contact")}
                >
                  {nlField(o, "btn_text") || o.btn_text}
                </button>
              </div>
            ))}
          </div>
          <div className="pricingNotice reveal">
            <strong>{t("pricing.cancellation_title")}</strong>
            <br />
            {c("cancellation_policy")}
          </div>
        </section>
