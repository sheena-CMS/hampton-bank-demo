/* Hampton Bank demo: tabs, filters, expanders. No dependencies. */
(function () {
  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* Tabs: <div class="tabs" role="tablist"><button data-tab="a">..</button></div> and <section class="panel" id="a">.
     The URL hash selects a tab (so links like page.html#a work). */
  var tabs = qsa('.tabs button[data-tab]');
  function show(id, push) {
    if (!tabs.length) return;
    var found = tabs.some(function (b) { return b.getAttribute('data-tab') === id; });
    if (!found) id = tabs[0].getAttribute('data-tab');
    tabs.forEach(function (b) {
      var on = b.getAttribute('data-tab') === id;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    qsa('.panel').forEach(function (p) { p.hidden = p.id !== id; });
    if (push && history.replaceState) history.replaceState(null, '', '#' + id);
  }
  tabs.forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-tab'), true); }); });
  if (tabs.length) {
    show((location.hash || '').replace('#', ''), false);
    window.addEventListener('hashchange', function () {
      var id = location.hash.replace('#', '');
      if (qs('.tabs button[data-tab="' + id + '"]')) show(id, false);
    });
  }

  /* Filters: buttons with data-filter="key:value" toggle rows with data-key="value". A search box with data-search filters row text. */
  qsa('[data-filter-group]').forEach(function (group) {
    var target = qs(group.getAttribute('data-filter-group'));
    if (!target) return;
    var state = {};
    function apply() {
      var q = (qs('input[data-search]', group) || { value: '' }).value.toLowerCase();
      qsa('[data-row]', target).forEach(function (row) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || row.getAttribute('data-' + k) === state[k]; });
        if (ok && q) ok = row.textContent.toLowerCase().indexOf(q) !== -1;
        row.hidden = !ok;
      });
      var c = qs('[data-count]', group.parentNode);
      if (c) c.textContent = qsa('[data-row]', target).filter(function (r) { return !r.hidden; }).length;
    }
    qsa('button[data-filter]', group).forEach(function (b) {
      b.addEventListener('click', function () {
        var kv = b.getAttribute('data-filter').split(':'), k = kv[0], v = kv[1] || '';
        var pressed = b.getAttribute('aria-pressed') === 'true';
        qsa('button[data-filter^="' + k + ':"]', group).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        state[k] = pressed ? '' : v;
        if (!pressed) b.setAttribute('aria-pressed', 'true');
        apply();
      });
    });
    var s = qs('input[data-search]', group);
    if (s) s.addEventListener('input', apply);
  });

  /* Expanders: <button class="xp" data-xp="id"> toggles [id].hidden */
  qsa('[data-xp]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-xp'));
      if (!t) return;
      t.hidden = !t.hidden;
      b.setAttribute('aria-expanded', t.hidden ? 'false' : 'true');
    });
  });

  /* Go/no-go style counters: inputs.chk inside [data-checklist] drive [data-done] and [data-total] and [data-verdict]. */
  qsa('[data-checklist]').forEach(function (box) {
    var boxes = qsa('input.chk', box);
    function upd() {
      var done = boxes.filter(function (x) { return x.checked; }).length;
      qsa('[data-done]', box).forEach(function (e) { e.textContent = done; });
      qsa('[data-total]', box).forEach(function (e) { e.textContent = boxes.length; });
      qsa('[data-verdict]', box).forEach(function (e) {
        e.textContent = done === boxes.length ? 'GO' : 'NOT YET';
        e.className = 'chip ' + (done === boxes.length ? 'green' : 'amber');
      });
    }
    boxes.forEach(function (x) { x.addEventListener('change', upd); });
    upd();
  });
})();

/* Demo contents list: on every page in /outputs/, a right-hand list of all outputs, current page highlighted. */
(function () {
  if (location.pathname.split(String.fromCharCode(92)).join('/').indexOf('/outputs/') === -1) return;
  var main = document.querySelector('main.wrap');
  if (!main || document.querySelector('.demo-nav')) return;
  var groups = [
    ['Project and tasks', [['00-project-on-a-page', 'Project on a page', '00'], ['01-action-list', 'Action list', '01'], ['02-open-questions', 'Open questions', '02'], ['03-risk-register', 'Risk register', '03']]],
    ['Frame the project', [['06-exec-one-pager', 'Executive one-pager', '04'], ['07-change-on-a-page', 'Change on a page', '05'], ['04-weekly-status', 'Weekly status report', '06'], ['09-phased-rollout', 'Phased rollout', '07'], ['10-kpi-scorecard', 'KPI scorecard', '08'], ['22-go-no-go', 'Go/no-go checklist', '09'], ['21-uat-schedule', 'UAT schedule', '10']]],
    ['Inputs and design', [['14-solution-overview', 'Solution overview', '11'], ['15-policy-timeline', 'AI policy timeline', '12'], ['16-sharepoint-review', 'SharePoint review', '13']]],
    ['The change plan', [['08-detailed-change-plan', 'Detailed change plan', '14'], ['11-stakeholder-list', 'Stakeholder list', '15'], ['12-org-chart', 'Org chart', '16'], ['13-as-is-to-be-impact', 'As-is, to-be and impact', '17'], ['17-comms-plan', 'Comms plan', '18'], ['18-learning-plan', 'Learning plan', '19'], ['19-training-schedule', 'Training schedule', '20'], ['20-training-form', 'Training form', '21']]],
    ['The base', [['05-shared-facts', 'Shared facts', '22']]]
  ];
  var here = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  if (!here || here === 'index') return; /* the landing page already lists every output */
  var h = '<nav class="demo-nav" aria-label="All outputs"><p class="dn-title">Project Compass</p>' +
    '<ul class="dn-top"><li><a href="../index.html">Home</a></li><li><a href="../loop/index.html">The loop</a></li><li><a href="index.html">All 22 outputs</a></li><li><a href="../sources/index.html">Sources</a></li></ul>';
  groups.forEach(function (g) {
    h += '<p class="dn-group">' + g[0] + '</p><ul>';
    g[1].forEach(function (p) {
      var cur = p[0] === here;
      var n = p[2]; /* shown number follows the order here, not the file name */
      h += '<li><a href="' + p[0] + '.html"' + (cur ? ' aria-current="page"' : '') + '><span class="dn-n">' + n + '</span>' + p[1] + '</a></li>';
    });
    h += '</ul>';
  });
  h += '</nav>';
  var shell = document.createElement('div');
  shell.className = 'shell';
  main.parentNode.insertBefore(shell, main);
  shell.appendChild(main);
  var aside = document.createElement('aside');
  aside.innerHTML = h;
  shell.appendChild(aside.firstChild);
  var cur = document.querySelector('.demo-nav [aria-current]');
  var nav = document.querySelector('.demo-nav');
  if (cur && nav && window.matchMedia('(min-width:1100px)').matches && cur.offsetTop + cur.offsetHeight > nav.clientHeight - 12) { nav.scrollTop = cur.offsetTop - nav.clientHeight + cur.offsetHeight + 40; }
})();
