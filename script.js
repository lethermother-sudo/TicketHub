document.querySelector('.hero-btn').addEventListener('click',()=>alert('Área de compra — conecte aqui seu checkout.'));
document.querySelector('.announce').addEventListener('click',()=>alert('Área de anúncio — conecte aqui o formulário do vendedor.'));
document.querySelector('.login').addEventListener('click',()=>alert('Área de login — conecte aqui sua autenticação.'));
const input=document.querySelector('.search input');
input.addEventListener('input',()=>{
  const q=input.value.toLowerCase().trim();
  document.querySelectorAll('.event-card').forEach(card=>{
    card.style.display=card.innerText.toLowerCase().includes(q)?'block':'none';
  });
});
