// Form validation Bootstrap 5
(() => {
  'use strict';
  const forms = document.querySelectorAll('.needs-validation');
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      },
      false
    );
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  // Tax Toggle logic
  const taxSwitch = document.getElementById('flexSwitchCheckDefault');
  const taxToggleBox = document.getElementById('taxToggleBox');

  if (taxSwitch) {
    const updateTaxDisplay = () => {
      const isChecked = taxSwitch.checked;
      const taxInfo = document.querySelectorAll('.tax-info');
      taxInfo.forEach(info => {
        info.style.display = isChecked ? 'inline' : 'none';
      });

      if (taxToggleBox) {
        if (isChecked) {
          taxToggleBox.classList.add('active');
        } else {
          taxToggleBox.classList.remove('active');
        }
      }
    };

    taxSwitch.addEventListener('change', updateTaxDisplay);

    if (taxToggleBox) {
      taxToggleBox.addEventListener('click', (e) => {
        // Prevent double toggling if user clicked directly on the input checkbox
        if (e.target !== taxSwitch && e.target.tagName !== 'LABEL') {
          taxSwitch.checked = !taxSwitch.checked;
          updateTaxDisplay();
        }
      });
    }

    // Initialize state
    updateTaxDisplay();
  }

  // Category Carousel Scrolling Logic
  const categoryScroll = document.getElementById('categoryScroll');
  const scrollLeftBtn = document.getElementById('catScrollLeft');
  const scrollRightBtn = document.getElementById('catScrollRight');

  if (categoryScroll && scrollLeftBtn && scrollRightBtn) {
    const checkScrollButtons = () => {
      const maxScrollLeft = categoryScroll.scrollWidth - categoryScroll.clientWidth;
      scrollLeftBtn.style.opacity = categoryScroll.scrollLeft > 10 ? '1' : '0.4';
      scrollRightBtn.style.opacity = categoryScroll.scrollLeft < maxScrollLeft - 10 ? '1' : '0.4';
    };

    scrollLeftBtn.addEventListener('click', () => {
      categoryScroll.scrollBy({ left: -240, behavior: 'smooth' });
    });

    scrollRightBtn.addEventListener('click', () => {
      categoryScroll.scrollBy({ left: 240, behavior: 'smooth' });
    });

    categoryScroll.addEventListener('scroll', checkScrollButtons);
    checkScrollButtons();
  }

  // Heart wishlist animation
  const heartBtns = document.querySelectorAll('.heart-btn');
  heartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const icon = btn.querySelector('i');
      if (icon.classList.contains('fa-regular')) {
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
        icon.style.color = '#fe424d';
        btn.style.transform = 'scale(1.25)';
        setTimeout(() => { btn.style.transform = ''; }, 200);
      } else {
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
        icon.style.color = 'white';
      }
    });
  });
});
