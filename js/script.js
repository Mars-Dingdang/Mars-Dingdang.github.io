(function($){
  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('.nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function(){
    startSearchAnim();
    $searchWrap.removeClass('on');
    stopSearchAnim();
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      title = $this.attr('data-title'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"><span class="fa fa-twitter" aria-hidden="true"></span></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"><span class="fa fa-facebook" aria-hidden="true"></span></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"><span class="fa fa-pinterest" aria-hidden="true"></span></a>',
            '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" class="article-share-linkedin" target="_blank" title="LinkedIn"><span class="fa fa-linkedin" aria-hidden="true"></span></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Theme mode and sidebar clock
  var setGiscusTheme = function(mode){
    var iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return;

    iframe.contentWindow.postMessage({
      giscus: {
        setConfig: {
          theme: mode === 'light' ? 'light' : 'dark'
        }
      }
    }, 'https://giscus.app');
  };

  var applyThemeMode = function(mode){
    var nextMode = mode === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextMode);
    $('.theme-toggle')
      .attr('aria-pressed', nextMode === 'light')
      .find('.theme-toggle-text')
      .text(nextMode === 'light' ? 'Dark Mode' : 'Light Mode');
    $('.theme-toggle .fa')
      .removeClass('fa-sun fa-moon')
      .addClass(nextMode === 'light' ? 'fa-moon' : 'fa-sun');
    setGiscusTheme(nextMode);
  };

  try {
    applyThemeMode(localStorage.getItem('theme-mode') || document.documentElement.getAttribute('data-theme') || 'dark');
  } catch (e) {
    applyThemeMode('dark');
  }

  $('.theme-toggle').on('click', function(){
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'light' ? 'dark' : 'light';

    try {
      localStorage.setItem('theme-mode', next);
    } catch (e) {}

    applyThemeMode(next);
  });

  var updateRailTime = function(){
    var timeEl = document.getElementById('rail-time');
    if (!timeEl) return;

    var label = timeEl.getAttribute('data-timezone-label') || 'UTC +8';
    var formatted = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date());

    timeEl.textContent = formatted + ' (' + label + ')';
  };

  updateRailTime();
  setInterval(updateRailTime, 30000);

  // Responsive sidebar drawer
  var $mobileRailToggle = $('.mobile-rail-toggle');
  var $mobileRailBackdrop = $('.mobile-rail-backdrop');

  var setMobileRail = function(open){
    var isOpen = !!open;

    $container.toggleClass('is-rail-open', isOpen);
    $('body').toggleClass('mobile-rail-locked', isOpen);
    $mobileRailToggle
      .attr('aria-expanded', isOpen ? 'true' : 'false')
      .attr('aria-label', isOpen ? 'Close sidebar menu' : 'Open sidebar menu');

    if (isOpen) {
      $mobileRailBackdrop.removeAttr('hidden');
    } else {
      $mobileRailBackdrop.attr('hidden', 'hidden');
    }
  };

  $mobileRailToggle.on('click', function(e){
    e.preventDefault();
    e.stopPropagation();
    setMobileRail(!$container.hasClass('is-rail-open'));
  });

  $mobileRailBackdrop.on('click', function(){
    setMobileRail(false);
  });

  $('.site-rail').on('click', 'a', function(){
    if (window.matchMedia('(max-width: 980px)').matches) {
      setMobileRail(false);
    }
  });

  $(document).on('keyup', function(e){
    if (e.key === 'Escape' && $container.hasClass('is-rail-open')) {
      setMobileRail(false);
    }
  });

  $(window).on('resize', function(){
    if (!window.matchMedia('(max-width: 980px)').matches) {
      setMobileRail(false);
    }
  });

  // Taxonomy search
  $('#taxonomy-filter').on('input', function(){
    var keyword = $(this).val().trim().toLowerCase();

    $('.taxonomy-row').each(function(){
      var name = $(this).attr('data-taxonomy-name') || '';
      $(this).toggleClass('is-hidden', keyword && name.indexOf(keyword) === -1);
    });
  });

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });
})(jQuery);
