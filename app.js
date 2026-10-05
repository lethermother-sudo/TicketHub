const { createClient } = window.supabase;

const db = createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);

function money(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  if (!value) return "Data a confirmar";

  return new Date(value).toLocaleDateString("pt-BR");
}

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[c])
  );
}


/* =========================
   EVENTOS
========================= */

const fallbackEvents = [
  {
    id: "demo-f1",
    name: "Fórmula 1 2026",
    city: "São Paulo, SP",
    event_date: "2026-11-06",
    image_url:
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1000&q=85",
    category: "Esportes"
  }
];

let EVENTS = [];


/* =========================
   CARREGAR EVENTOS
========================= */

async function loadEvents() {
  try {
    const { data, error } = await db
      .from("events")
      .select("*")
      .order("event_date", {
        ascending: true
      });

    if (error) {
      console.error("Erro ao carregar eventos:", error);
      EVENTS = fallbackEvents;
      return EVENTS;
    }

    EVENTS = data || [];

    if (!EVENTS.length) {
      EVENTS = fallbackEvents;
    }

    return EVENTS;

  } catch (error) {
    console.error("Erro de conexão com Supabase:", error);
    EVENTS = fallbackEvents;
    return EVENTS;
  }
}


/* =========================
   CARD DO EVENTO
========================= */

function eventCard(event) {
  return `
    <article
      class="card"
      onclick="location.href='evento.html?id=${encodeURIComponent(event.id)}'"
    >

      <img
        src="${escapeHtml(event.image_url || "")}"
        alt=""
      >

      <div>

        <small>
          ${formatDate(event.event_date)}
        </small>

        <h3>
          ${escapeHtml(event.name)}
        </h3>

        <p>
          ${escapeHtml(
            [event.city, event.venue]
              .filter(Boolean)
              .join(" • ")
          )}
        </p>

        <div class="price">
          Ingressos disponíveis
        </div>

      </div>

    </article>
  `;
}


/* =========================
   MOSTRAR EVENTOS
========================= */

function renderEvents(list = EVENTS) {
  const element =
    document.getElementById("eventGrid");

  if (!element) return;

  if (!list.length) {
    element.innerHTML = `
      <div class="card">
        <div>
          <h3>Nenhum evento encontrado</h3>
          <p>
            Ainda não existem eventos publicados.
          </p>
        </div>
      </div>
    `;

    return;
  }

  element.innerHTML =
    list.map(eventCard).join("");
}


/* =========================
   HOME / EVENTOS
========================= */

async function initHomeOrEvents() {
  const grid =
    document.getElementById("eventGrid");

  if (!grid) return;

  await loadEvents();

  renderEvents();

  const search =
    document.getElementById("search");

  if (search) {
    search.addEventListener(
      "input",
      () => {
        const query =
          search.value
            .trim()
            .toLowerCase();

        const filtered =
          EVENTS.filter(event => {
            const text = `
              ${event.name || ""}
              ${event.city || ""}
              ${event.category || ""}
              ${event.venue || ""}
            `.toLowerCase();

            return text.includes(query);
          });

        renderEvents(filtered);
      }
    );
  }
}


/* =========================
   PÁGINA DO EVENTO
========================= */

async function initEventPage() {
  const page =
    document.getElementById("eventPage");

  if (!page) return;

  await loadEvents();

  const params =
    new URLSearchParams(location.search);

  const id =
    params.get("id");

  const event =
    EVENTS.find(
      item => String(item.id) === String(id)
    );

  if (!event) {
    page.innerHTML = `
      <div class="form-page">

        <h1>
          Evento não encontrado
        </h1>

        <a
          class="btn"
          href="eventos.html"
        >
          Voltar aos eventos
        </a>

      </div>
    `;

    return;
  }


  let listings = [];

  try {
    const result =
      await db
        .from("listings")
        .select("*")
        .eq("event_id", event.id)
        .eq("status", "available")
        .order("price_cents", {
          ascending: true
        });

    if (!result.error) {
      listings = result.data || [];
    } else {
      console.error(
        "Erro ao carregar anúncios:",
        result.error
      );
    }

  } catch (error) {
    console.error(
      "Erro ao carregar ingressos:",
      error
    );
  }


  page.innerHTML = `

    <img
      style="
        width:100%;
        max-height:430px;
        object-fit:cover;
        border-radius:18px
      "
      src="${escapeHtml(event.image_url || "")}"
      alt=""
    >

    <h1>
      ${escapeHtml(event.name)}
    </h1>

    <p>
      ${escapeHtml(
        [event.city, event.venue]
          .filter(Boolean)
          .join(" • ")
      )}

      ${
        event.event_date
          ? " • " + formatDate(event.event_date)
          : ""
      }
    </p>

    ${
      event.description
        ? `<p>${escapeHtml(event.description)}</p>`
        : ""
    }

    <hr>

    <h2>
      Ingressos disponíveis
    </h2>

    <div class="offers">

      ${
        listings.length
          ? listings
              .map(
                listing => `

                <div class="card">

                  <div>

                    <h3>
                      ${escapeHtml(
                        listing.sector ||
                        "Setor não informado"
                      )}
                    </h3>

                    <p>
                      ${Number(listing.quantity || 0)}
                      ingresso(s) disponível(is)
                    </p>

                    <div class="price">
                      ${money(
                        listing.price_cents
                      )}
                      por ingresso
                    </div>

                    <br>

                    <button
                      class="btn"
                      onclick="alert('Compra será liberada na próxima etapa.')"
                    >
                      Comprar ingresso
                    </button>

                  </div>

                </div>

              `
              )
              .join("")

          : `

            <div class="card">

              <div>

                <h3>
                  Ainda não há anúncios
                </h3>

                <p>
                  Se você possui ingresso
                  para este evento,
                  pode anunciá-lo no TicketHub.
                </p>

                <a
                  class="btn"
                  href="anunciar.html?event=${encodeURIComponent(event.id)}"
                >
                  Anunciar ingresso
                </a>

              </div>

            </div>

          `
      }

    </div>
  `;
}


/* =========================
   ANUNCIAR INGRESSO
========================= */

async function initSell() {
  const form =
    document.getElementById("sellForm");

  if (!form) return;

  await loadEvents();

  const select =
    document.getElementById("sellEvent");

  if (select) {

    select.innerHTML =
      EVENTS
        .map(
          event => `
            <option
              value="${escapeHtml(event.id)}"
            >
              ${escapeHtml(event.name)}
            </option>
          `
        )
        .join("");


    /* Se veio de um evento específico */
    const params =
      new URLSearchParams(location.search);

    const eventId =
      params.get("event");

    if (
      eventId &&
      EVENTS.some(
        event =>
          String(event.id) === String(eventId)
      )
    ) {
      select.value = eventId;
    }
  }


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      /* =========================
         VERIFICAR LOGIN
      ========================= */

      const {
        data: { user }
      } = await db.auth.getUser();


      if (!user) {

        alert(
          "Entre na sua conta antes de anunciar um ingresso."
        );

        location.href =
          "login.html";

        return;
      }


      /* =========================
         LER FORMULÁRIO
      ========================= */

      const formData =
        new FormData(form);


      const eventId =
        String(
          formData.get("event_id") || ""
        );


      const sector =
        String(
          formData.get("sector") || ""
        ).trim();


      const quantity =
        Number(
          formData.get("quantity")
        );


      const priceInput =
        String(
          formData.get("price") || ""
        ).replace(",", ".");


      const price =
        Number(priceInput);


      /* =========================
         VALIDAÇÕES
      ========================= */

      if (!eventId) {

        alert(
          "Selecione um evento."
        );

        return;
      }


      if (!sector) {

        alert(
          "Informe o setor do ingresso."
        );

        return;
      }


      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {

        alert(
          "Informe uma quantidade válida de ingressos."
        );

        return;
      }


      if (
        !Number.isFinite(price) ||
        price <= 0
      ) {

        alert(
          "Informe um preço válido."
        );

        return;
      }


      const priceCents =
        Math.round(price * 100);


      if (priceCents < 100) {

        alert(
          "O preço mínimo é R$ 1,00."
        );

        return;
      }


      /* =========================
         EVENTO ESCOLHIDO
      ========================= */

      const selectedEvent =
        EVENTS.find(
          item =>
            String(item.id) ===
            String(eventId)
        );


      if (!selectedEvent) {

        alert(
          "Evento não encontrado."
        );

        return;
      }


      /* =========================
         CRIAR ANÚNCIO
      ========================= */

      const payload = {
        event_id: selectedEvent.id,
        seller_id: user.id,
        sector: sector,
        quantity: quantity,
        price_cents: priceCents,
        status: "available"
      };


      const {
        data,
        error
      } = await db
        .from("listings")
        .insert(payload)
        .select()
        .single();


      if (error) {

        console.error(
          "Erro ao publicar anúncio:",
          error
        );

        alert(
          "Não foi possível publicar o ingresso:\n\n" +
          error.message
        );

        return;
      }


      if (!data) {

        alert(
          "O anúncio não retornou os dados esperados."
        );

        return;
      }


      /* =========================
         SUCESSO
      ========================= */

      alert(
        "Ingresso publicado com sucesso! 🎟️"
      );


      location.href =
        "evento.html?id=" +
        encodeURIComponent(
          selectedEvent.id
        );
    }
  );
}


/* =========================
   LOGIN
========================= */

async function initLogin() {
  const form =
    document.getElementById("loginForm");

  if (!form) return;

  const mode =
    document.getElementById("loginMode");


  form.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const email =
        document
          .getElementById("email")
          .value
          .trim();

      const password =
        document
          .getElementById("password")
          .value;


      const signUp =
        mode?.value === "signup";


      const result =
        signUp

          ? await db.auth.signUp({
              email,
              password
            })

          : await db.auth.signInWithPassword({
              email,
              password
            });


      if (result.error) {

        alert(
          result.error.message
        );

        return;
      }


      alert(
        signUp
          ? "Conta criada. Verifique seu e-mail se o Supabase solicitar."
          : "Login realizado!"
      );


      location.href =
        "index.html";
    }
  );
}


/* =========================
   INICIAR
========================= */

async function init() {

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY
  ) {

    console.error(
      "TicketHub: configuração do Supabase não encontrada."
    );

    return;
  }


  if (!window.supabase) {

    console.error(
      "TicketHub: biblioteca do Supabase não carregou."
    );

    return;
  }


  await initHomeOrEvents();

  await initEventPage();

  await initSell();

  await initLogin();
}


init();
