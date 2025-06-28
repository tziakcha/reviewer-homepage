(function attachReviewer() {
  const bz2tc = (s) => {
    const type = s[0];
    const num = parseInt(s.slice(1)) - 1;
    if (type === "W") return num + 0;
    else if (type === "T") return num + 9;
    else if (type === "B") return num + 18;
    else if (type === "F") return num + 27;
    else if (type === "J") return num + 31;
    else if (type === "H") return num + 34;
    else {
      console.log("Unknown tile:", s);
      return -1;
    }
  };

  const act2str = (act) => {
    act = act.trim();
    if (act.startsWith("Chi")) {
      const components = act.split(/\s+/);
      const tile = tc2tile(bz2tc(components.at(-1)));
      const chi = `${+tile[0] - 1}${tile[0]}${+tile[0] + 1}${tile[1]}`;
      return [...components.slice(0, -1), chi].join(" ");
    } else if ("1" <= act.at(-1) && act.at(-1) <= "9") {
      const components = act.split(/\s+/);
      return [
        ...components.slice(0, -1),
        tc2tile(bz2tc(components.at(-1))),
      ].join(" ");
    } else return act;
  };

  const tc2tile = (i) => TILE[i * 4];
  const fmtLoad = (i) => {
    switch (i) {
      case 0:
        return "✗";
      case 1:
        return "·";
      case 2:
        return "✓";
      default:
        return "_";
    }
  };

  const show_cands = () => {
    const roundStr = document.getElementById("round").innerHTML;
    const round =
      WIND.findIndex((x) => x === roundStr[0]) * 4 +
      WIND.findIndex((x) => x === roundStr[2]);
    document.getElementById("review-log").innerHTML = `CHAGA Reviewer [Step ${
      window.__ri
    }] [Load ${window.__reviews_seats.map(fmtLoad).join(" ")}]`;
    document.getElementById("review").innerHTML = "";
    const resp = __reviews[`${round}-${__ri}`];
    if (resp?.extra?.candidates?.length) {
      document.getElementById("review").innerHTML = resp.extra.candidates
        .map(
          ([weight, act]) =>
            `${act2str(act)}&nbsp;&nbsp;-&nbsp;&nbsp;${weight.toFixed(2)}`
        )
        .join("<br>");
    }
  };

  const initRI = () => (window.__ri = -18);

  if (!window.__attached) {
    window.__reviews = {};
    window.__reviews_seats = [undefined, undefined, undefined, undefined];
    const next_stp = document.getElementById("nextstp").onclick;
    const prev_stp = document.getElementById("prevstp").onclick;
    const next = document.getElementById("next").onclick;
    const prev = document.getElementById("prev").onclick;
    const next_stp2 = () => {
      window.__ri++;
      const status1 = document.getElementById("status1").innerHTML;
      next_stp();
      if (document.getElementById("status1").innerHTML === status1)
        window.__ri--;
      show_cands();
    };
    const prev_stp2 = () => {
      window.__ri--;
      const status1 = document.getElementById("status1").innerHTML;
      prev_stp();
      if (document.getElementById("status1").innerHTML === status1)
        window.__ri++;
      show_cands();
    };

    initRI();
    document.getElementById("nextstp").onclick = next_stp2;
    document.getElementById("prevstp").onclick = prev_stp2;
    document.getElementById("next").onclick = () => {
      next();
      initRI();
    };
    document.getElementById("prev").onclick = () => {
      prev();
      initRI();
    };
    const muswhl = function (y) {
      if (y > 0) next_stp2();
      else if (y < 0) prev_stp2();
    };

    const ctn = document.getElementById("container");
    if (!window.navigator.userAgent.includes("Firefox")) {
      ctn.onmousewheel = function (e) {
        muswhl(e.deltaY);
        e.preventDefault();
      };
    } else {
      ctn.addEventListener("DOMMouseScroll", function (e) {
        muswhl(e.detail);
        e.preventDefault();
      });
    }

    {
      const div = document.createElement("div");
      div.classList.add("fs-sm");
      const span = document.createElement("span");
      div.appendChild(span);
      document.getElementById("ctrl").appendChild(div);
      span.id = "review-log";
    }
    {
      const div = document.createElement("div");
      div.classList.add("fs-sm");
      const span = document.createElement("span");
      div.appendChild(span);
      document.getElementById("ctrl").appendChild(div);
      span.id = "review";
    }
    window.__attached = true;
    console.log("Reviewer attached");
  }

  const gameId = document
    .getElementById("ti")
    .children[0].href.split("=")
    .at(-1);
  const seat = +document.getElementById("view").value;
  const roundStr = document.getElementById("round").innerHTML;
  const round =
    WIND.findIndex((x) => x === roundStr[0]) * 4 +
    WIND.findIndex((x) => x === roundStr[2]);
  const initialSeat = O2S[0][S2O[round][seat]];
  for (let is = 0; is <= 3; is++) {
    if (window.__reviews_seats[is]) continue;
    window.__reviews_seats[is] = 1;
    fetch(`https://tc-api.pesiu.org/review/?id=${gameId}&seat=${is}`)
      .then((r) => r.json())
      .then((r) => {
        if (r.code) {
          window.__reviews_seats[is] = 0;
          console.error("Error fetching review data:", r.message);
          return;
        }
        r.data.forEach((d) => {
          if (d.ri) window.__reviews[`${d.rr}-${d.ri}`] = d;
        });
        window.__reviews_seats[is] = 2;
        console.log("Download finish", gameId, is);
        show_cands();
      })
      .catch((e) => {
        window.__reviews_seats[is] = 0;
        console.log("Download failed", gameId, is);
      });
  }
  show_cands();
})();
