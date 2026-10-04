/** Petits scripts natifs : marchent même si React n’hydrate pas. */
export function VanillaEnhance() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){
  document.addEventListener('input', function(e){
    var t = e.target;
    if (!t || t.getAttribute('data-autosubmit') !== 'input') return;
    clearTimeout(t._t);
    t._t = setTimeout(function(){ if (t.form) t.form.requestSubmit(); }, 280);
  });
  document.addEventListener('change', function(e){
    var t = e.target;
    if (t && t.getAttribute('data-autosubmit') === 'change' && t.form) t.form.requestSubmit();
  });
})();`,
      }}
    />
  );
}
