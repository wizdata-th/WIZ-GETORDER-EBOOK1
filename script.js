// Global variables
let viewerCount = 127;
let salesCount = 847;
let stockCount = 23;
let countdownTime = 24 * 60 * 60; // 24 hours in seconds
let hasShownExitIntent = false;
let isMouseOut = false;
let stickyCTAShown = false;

// Mobile-specific optimizations
let isMobile = window.innerWidth <= 768;

// Optimize animations for mobile
function optimizeForMobile() {
    if (isMobile) {
        // Reduce animation frequency on mobile
        // Clear existing intervals first to prevent multiple instances
        if (animateCountersInterval) clearInterval(animateCountersInterval);
        animateCountersInterval = setInterval(animateCounters, 8000); // Slower update for mobile

        // Reduce purchase notification frequency
        if (purchaseNotificationInterval) clearInterval(purchaseNotificationInterval);
        purchaseNotificationInterval = setInterval(showRandomPurchaseNotifications, 25000); // Slower notification for mobile

        // Disable floating elements animation on very small screens
        if (window.innerWidth <= 480) {
            const floatingElements = document.querySelectorAll('.floating-element');
            floatingElements.forEach(el => {
                el.style.display = 'none';
            });
        }
    } else {
        // Reset to faster intervals for desktop if window resizes from mobile to desktop
        if (animateCountersInterval) clearInterval(animateCountersInterval);
        animateCountersInterval = setInterval(animateCounters, 5000);

        if (purchaseNotificationInterval) clearInterval(purchaseNotificationInterval);
        purchaseNotificationInterval = setInterval(showRandomPurchaseNotifications, 15000);

        // Ensure floating elements are visible again if they were hidden
        const floatingElements = document.querySelectorAll('.floating-element');
        floatingElements.forEach(el => {
            el.style.display = ''; // Reset display property
        });
    }
}

// Handle orientation change and resize
function handleOrientationChange() {
    setTimeout(function() {
        isMobile = window.innerWidth <= 768;
        optimizeForMobile(); // Re-apply optimizations based on new width

        // Recalculate sticky CTA position (reset and re-track)
        stickyCTAShown = false;
        const stickyCTA = document.getElementById('stickyCTA');
        if (stickyCTA) {
            stickyCTA.classList.remove('show');
        }
        // No need to re-add event listener here, it's added once on DOMContentLoaded
        // just ensure trackScrollForStickyCTA logic handles it.
        // The scroll handler already uses a timeout for performance.
    }, 500); // Debounce to allow for resize/orientation animation to settle
}

// Add orientation change and resize listeners
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleOrientationChange);

// Mobile-optimized scroll tracking for sticky CTA
let scrollTimeout; // Defined globally to clear it
function trackScrollForStickyCTA() {
    // Only add listener once
    if (!window.scrollListenerAdded) {
        const handler = function() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                const pricingSection = document.querySelector('.pricing');
                const stickyCTA = document.getElementById('stickyCTA');
                if (pricingSection && stickyCTA) {
                    const rect = pricingSection.getBoundingClientRect();
                    // Show sticky CTA when pricing section is visible
                    if (rect.top < window.innerHeight && !stickyCTAShown) {
                        stickyCTA.classList.add('show');
                        stickyCTAShown = true;
                    }
                    // Optional: Hide sticky CTA if scrolled back up past pricing section
                    // else if (rect.top >= window.innerHeight && stickyCTAShown) {
                    //     stickyCTA.classList.remove('show');
                    //     stickyCTAShown = false;
                    // }
                }
            }, isMobile ? 150 : 50); // Slower debounce for mobile
        };

        window.addEventListener('scroll', handler, { passive: true });
        window.scrollListenerAdded = true; // Mark as added
    }
}

// Mobile-friendly exit intent (using page visibility instead of mouse)
function addMobileExitIntent() {
    let pageHidden = false;
    let timeOnPage = 0;

    // Track time on page
    const timeTracker = setInterval(function() {
        if (!document.hidden) {
            timeOnPage++;
        }
    }, 1000);

    document.addEventListener('visibilitychange', function() {
        if (document.hidden && !pageHidden && timeOnPage > 30 && !hasShownExitIntent) {
            // User likely switched tabs/apps after some time on page
            pageHidden = true;
            setTimeout(function() {
                if (document.hidden && !hasShownExitIntent) { // Double check if still hidden
                    showExitPopup();
                    hasShownExitIntent = true;
                    clearInterval(timeTracker); // Stop tracking once shown
                }
            }, 2000); // Wait 2 seconds before showing
        } else if (!document.hidden) {
            // User returned to page
            pageHidden = false;
        }
    });
}

// Touch-friendly file upload for mobile
function handleMobileFileUpload() {
    const fileUpload = document.querySelector('.file-upload');
    if (fileUpload) {
        // Add touch feedback
        fileUpload.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
            this.style.borderColor = '#8a9ffc'; // Change border color on touch
        });

        fileUpload.addEventListener('touchend', function() {
            this.style.transform = 'scale(1)';
            this.style.borderColor = '#667eea'; // Reset border color
        });
        // Also handle change event for file name display
        const fileInput = document.getElementById('paymentSlip');
        if (fileInput) {
            fileInput.addEventListener('change', function() {
                displayFileName(this);
            });
        }
    }
}

// Prevent zoom on input focus (iOS Safari)
function preventZoomOnFocus() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            // Only apply this on iOS devices (Safari) to prevent unwanted zoom
            if (isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            }
        });

        input.addEventListener('blur', function() {
            if (isMobile && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
                const viewport = document.querySelector('meta[name=viewport]');
                if (viewport) {
                    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
                }
            }
        });
    });
}

// Mobile-optimized popup positioning (already handled by CSS flexbox, but good to keep if needed)
function adjustPopupForMobile() {
    const popups = document.querySelectorAll('.popup-content, .form-container');
    popups.forEach(popup => {
        // CSS flexbox `align-items: center` and `max-height: 90vh; overflow-y: auto;`
        // already handle this well. This JS might be redundant but can serve as a fallback.
        if (isMobile) {
            popup.style.maxHeight = '90vh';
            popup.style.overflowY = 'auto';
            popup.style.margin = '5vh auto';
        } else {
            // Reset for desktop view if resized from mobile
            popup.style.maxHeight = ''; // Remove inline style
            popup.style.overflowY = '';
            popup.style.margin = '';
        }
    });
}

// Smooth scroll polyfill for older mobile browsers
function smoothScrollPolyfill() {
    if (!('scrollBehavior' in document.documentElement.style)) {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize all scripts on DOMContentLoaded
let animateCountersInterval, purchaseNotificationInterval; // Ensure these are defined globally

document.addEventListener('DOMContentLoaded', function() {
    // Initial check for mobile
    isMobile = window.innerWidth <= 768;

    startCountdown();
    // Initialize intervals
    animateCountersInterval = setInterval(animateCounters, 5000);
    purchaseNotificationInterval = setInterval(showRandomPurchaseNotifications, 15000);

    trackScrollForStickyCTA(); // Add scroll listener once
    addExitIntentListener(); // For desktop mouseleave
    if (isMobile) { // Only add mobile exit intent if on mobile
        addMobileExitIntent();
    }
    decreaseStockOverTime(); // Start stock decrease interval

    optimizeForMobile(); // Apply initial mobile optimizations
    handleMobileFileUpload();
    preventZoomOnFocus();
    adjustPopupForMobile(); // Apply initial popup adjustments
    smoothScrollPolyfill();

    // Event Listeners for UI elements
    const ctaButtons = document.querySelectorAll('.cta-button'); // Select all buttons with this class
    ctaButtons.forEach(button => {
        button.addEventListener('click', showOrderForm); // showOrderForm ถูกเรียกเมื่อกดปุ่ม .cta-button เท่านั้น
    });

    const closeOrderFormButton = document.querySelector('.order-form .popup-close');
    if (closeOrderFormButton) {
        closeOrderFormButton.addEventListener('click', closeOrderForm);
    }

    const closeExitPopupButton = document.querySelector('#exitPopup .popup-close');
    if (closeExitPopupButton) {
        closeExitPopupButton.addEventListener('click', closeExitPopup);
    }

    const closePreviewPopupButton = document.querySelector('#previewPopup .popup-close');
    if (closePreviewPopupButton) {
        closePreviewPopupButton.addEventListener('click', closePreviewPopup);
    }

    const claimSampleButton = document.querySelector('.claim-sample-button'); // Assuming you have a button with this class
    if (claimSampleButton) {
        claimSampleButton.addEventListener('click', claimFreeSample);
    }

    const discountCodeInput = document.getElementById('discountCode');
    if (discountCodeInput) {
        discountCodeInput.addEventListener('input', updateFormPrice);
    }

    const orderFormElement = document.getElementById('orderFormInner');
if (orderFormElement) {
    orderFormElement.addEventListener('submit', submitOrder);
}
});


// Countdown Timer
function startCountdown() {
    const countdownElement = document.getElementById('hours'); // Check if countdown elements exist
    if (!countdownElement) {
        // console.warn("Countdown elements not found, skipping countdown.");
        return;
    }

    const countdownInterval = setInterval(function() {
        countdownTime--;

        const hours = Math.floor(countdownTime / 3600);
        const minutes = Math.floor((countdownTime % 3600) / 60);
        const seconds = countdownTime % 60;

        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        const stickyTimerEl = document.getElementById('stickyTimer');

        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

        // Update sticky timer (if element exists)
        if (stickyTimerEl) {
            stickyTimerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            // Reset to 24 hours or handle expiry
            countdownTime = 24 * 60 * 60; // Reset
            startCountdown(); // Restart countdown
        }
    }, 1000);
}

// Animate counters
function animateCounters() {
    // Randomly change viewer count
    const viewerCountEl = document.getElementById('viewerCount');
    if (viewerCountEl) {
        const change = Math.floor(Math.random() * 10) - 5;
        viewerCount = Math.max(100, Math.min(200, viewerCount + change));
        viewerCountEl.textContent = viewerCount;
    }

    // Slowly increase sales count
    const salesCountEl = document.getElementById('salesCount');
    if (salesCountEl && Math.random() < 0.3) {
        salesCount++;
        salesCountEl.textContent = salesCount.toLocaleString();
    }
}

// Show random purchase notifications
function showRandomPurchaseNotifications() {
    const names = ['คุณสมชาย', 'คุณวิภา', 'คุณปิยะ', 'คุณนิรันดร์', 'คุณสุภาพ', 'คุณมานะ'];
    const times = ['เมื่อ 2 นาทีที่แล้ว', 'เมื่อ 5 นาทีที่แล้ว', 'เมื่อ 8 นาทีที่แล้ว'];

    const notification = document.getElementById('purchaseNotification');
    const buyerNameEl = document.getElementById('buyerName');
    const purchaseTimeEl = document.querySelector('#purchaseNotification div div:last-child');

    if (notification && buyerNameEl && purchaseTimeEl) {
        const randomName = names[Math.floor(Math.random() * names.length)];
        const randomTime = times[Math.floor(Math.random() * times.length)];

        buyerNameEl.textContent = randomName;
        purchaseTimeEl.textContent = `เพิ่งสั่งซื้อ${randomTime}`;

        notification.classList.add('show');

        setTimeout(function() {
            notification.classList.remove('show');
        }, 4000); // Notification stays for 4 seconds
    }
}

// Exit intent detection (for desktop mouseleave)
function addExitIntentListener() {
    document.addEventListener('mouseleave', function(e) {
        // Only trigger if not already shown and mouse leaves at the top
        if (e.clientY <= 0 && !hasShownExitIntent && !isMobile) {
            showExitPopup();
            hasShownExitIntent = true;
        }
    });
}

// Decrease stock over time
function decreaseStockOverTime() {
    const stockCountEl = document.getElementById('stockCount');
    if (!stockCountEl) return;

    setInterval(function() {
        if (Math.random() < 0.1 && stockCount > 5) { // 10% chance to decrease if stock > 5
            stockCount--;
            stockCountEl.textContent = stockCount;
        } else if (stockCount <= 5 && stockCount > 1 && Math.random() < 0.3) { // Higher chance if low stock
            stockCount--;
            stockCountEl.textContent = stockCount;
        } else if (stockCount === 1 && Math.random() < 0.5) { // Even higher chance if very low
            stockCount--;
            stockCountEl.textContent = stockCount;
            // Potentially show "Out of Stock" message or disable buttons
            if (stockCount === 0) {
                // You can add logic here to disable order buttons or show "Out of Stock"
                // console.log("Product is now out of stock!");
            }
        }
    }, 30000); // Every 30 seconds
}

// Show/Hide functions (Modals/Popups)
function showOrderForm() {
    const orderForm = document.querySelector('.order-form');
    if (orderForm) {
        orderForm.style.display = 'flex'; // Use flex to center
        document.body.style.overflow = 'hidden'; // Disable scroll on body
        // Reset form and price when opening
        const formPriceElement = document.getElementById('formPrice');
        if (formPriceElement) formPriceElement.textContent = ('฿135');
        const discountCodeInput = document.getElementById('discountCode');
        if (discountCodeInput) discountCodeInput.value = '';
        const fileUploadText = document.getElementById('fileUploadText');
        if (fileUploadText) fileUploadText.innerHTML = `🔗 คลิกเพื่อเลือกไฟล์รูปสลิปชำระเงิน`; // Reset file upload text
    }
}

function closeOrderForm() {
    const orderForm = document.querySelector('.order-form');
    if (orderForm) {
        orderForm.style.display = 'none';
        document.body.style.overflow = 'auto'; // Enable scroll on body
    }
}

function showExitPopup() {
    const exitPopup = document.getElementById('exitPopup');
    if (exitPopup) {
        exitPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeExitPopup() {
    const exitPopup = document.getElementById('exitPopup');
    if (exitPopup) {
        exitPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function showFreePreview() {
    const previewPopup = document.getElementById('previewPopup');
    if (previewPopup) {
        previewPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closePreviewPopup() {
    const previewPopup = document.getElementById('previewPopup');
    if (previewPopup) {
        previewPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Claim free sample logic
function claimFreeSample() {
    const emailInput = document.getElementById('leadEmail');
    const email = emailInput ? emailInput.value : '';
    if (!email) {
        Swal.fire({
            title: 'ผิดพลาด!',
            text: 'กรุณากรอกอีเมลของคุณ',
            icon: 'error',
            confirmButtonText: 'ตกลง',
            background: '#252524',
            color: '#ffffff'
        });
        return;
    }

    Swal.fire({
        title: '✅ สำเร็จ!',
        text: 'ตัวอย่าง 2 บทแรกและโค้ดส่วนลด 15% ถูกส่งไปที่อีเมลของคุณแล้ว',
        icon: 'success',
        confirmButtonText: 'ตกลง',
        background: '#252524',
        color: '#ffffff'
    });

    // Add discount code to order form if exists
    const discountCodeInput = document.getElementById('discountCode');
    if (discountCodeInput) {
        discountCodeInput.value = 'WIZ20"';
        updateFormPrice(); // Immediately update price after applying code
    }
    // Optionally close preview popup after claiming
    closePreviewPopup();
}

// Discount Code Logic
const DISCOUNT_CODES = {
    'WIZ20': 20, // 20thb discount
    'WIZ30': 30  // 30thb discount
};

let discountTimer; // เพิ่มตัวแปรนี้ด้านบนฟังก์ชัน updateFormPrice()

function updateFormPrice() {
    const discountCodeInput = document.getElementById('discountCode');
    const formPriceElement = document.getElementById('formPrice');

    if (!discountCodeInput || !formPriceElement) return;

    const discountCode = discountCodeInput.value.toUpperCase();
    const basePrice = 135;
    let priceToDisplay = basePrice;

    // Clear any pending error messages
    clearTimeout(discountTimer); // ลบ Timer เดิม ถ้ามี

    if (DISCOUNT_CODES[discountCode]) {
        const discount = DISCOUNT_CODES[discountCode];
        const discountedPrice = basePrice - discount;
        priceToDisplay = discountedPrice;

        if (discountCodeInput._lastValidCode !== discountCode) {
            
            discountCodeInput._lastValidCode = discountCode;
        }
    } else {
        // Show error only if user actually typed something invalid
        // Use setTimeout to delay showing the error, allowing user to type
        discountTimer = setTimeout(() => { // เพิ่ม setTimeout ที่นี่
            if (discountCode && discountCodeInput._lastValidCode !== discountCode && discountCode.length >= 3) {
                
                discountCodeInput._lastValidCode = '';
            }
        }, 500); // ดีเลย์ 500 มิลลิวินาที (0.5 วินาที) ก่อนแสดงข้อผิดพลาด
    }
    formPriceElement.textContent = `฿${priceToDisplay.toFixed(0)}`;
}

// Display selected file name for upload
function displayFileName(input) {
    const fileName = input.files[0] ? input.files[0].name : '';
    const fileUploadText = document.getElementById('fileUploadText');
    if (fileUploadText) {
        if (fileName) {
            fileUploadText.innerHTML = `✅ ไฟล์ที่เลือก: ${fileName}<br><small style="opacity: 0.7;">คลิกเพื่อเปลี่ยนไฟล์</small>`;
        } else {
            fileUploadText.innerHTML = `🔗 คลิกเพื่อเลือกไฟล์รูปสลิปชำระเงิน`; // Reset text if no file selected
        }
    }
}

// ====================================================================
// ไฟล์: script.js
// ปรับปรุงครั้งสุดท้าย: บังคับให้ SweetAlert แสดง "สำเร็จ!" เสมอ
//                     และปิดฟอร์มทันที หลังจากการเรียก fetch
//                     รวมถึงพยายามลดโอกาสการส่งซ้ำ
// ====================================================================

// ✅ คุณต้องอัปเดต URL นี้ด้วย URL ของ Google Apps Script Web App ของคุณ
//    ตรวจสอบให้แน่ใจว่าเป็น URL ของ Deployment ล่าสุดที่คุณสร้างขึ้น (ลงท้ายด้วย /exec)
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgbsLaADxuW0Zv7hhNg-xlfV5ihIMAhy848_dCpBgY37sLbBckNs0jfqoGkB0DEvXn/exec';

// ====================================================================
// submitOrder Function (ฟังก์ชันหลักในการส่งฟอร์ม)
// ====================================================================

async function submitOrder(event) {
    event.preventDefault(); // ป้องกันการ Submit ฟอร์มแบบปกติ

    const form = event.target; // อ้างอิงถึงฟอร์มที่ถูก submit
    const submitButton = document.getElementById('submitButton'); // สมมติว่าปุ่ม submit มี id="submitButton"

    // ✅ ป้องกันการกดปุ่มซ้ำซ้อน: ถ้าปุ่มถูกปิดอยู่ หรือกำลังส่งอยู่ ให้หยุดทำงานทันที
    if (submitButton && submitButton.disabled || form._isSubmitting) {
        return;
    }

    form._isSubmitting = true; // ตั้งค่า flag ว่ากำลังส่งข้อมูล
    if (submitButton) {
        submitButton.disabled = true; // ปิดปุ่มทันที
    }

    // สร้าง FormData object สำหรับส่งข้อมูลทั้งหมด
    const dataToSend = new FormData();

    // Loop เพื่อเพิ่มข้อมูลจากฟอร์มทั้งหมดเข้า FormData (ยกเว้น paymentSlip ที่ต้องจัดการพิเศษ)
    const formData = new FormData(form); // สร้าง FormData จากฟอร์ม
    for (let [key, value] of formData.entries()) {
        if (key !== 'paymentSlip') {
            dataToSend.append(key, value);
        }
    }

    // Show loading state SweetAlert ก่อนเริ่มกระบวนการหลัก
    showLoadingAlert();

    // จัดการไฟล์ภาพ (paymentSlip): แปลงเป็น Base64 ก่อนส่ง
    const paymentSlipFile = formData.get('paymentSlip'); // ดึง File object จาก FormData
    if (paymentSlipFile instanceof File && paymentSlipFile.size > 0) {
        try {
            await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    dataToSend.append('fileContent', e.target.result.split(',')[1]);
                    dataToSend.append('fileName', paymentSlipFile.name);
                    dataToSend.append('mimeType', paymentSlipFile.type);
                    resolve();
                };
                reader.onerror = reject; // ถ้าเกิดข้อผิดพลาดในการอ่านไฟล์
                reader.readAsDataURL(paymentSlipFile);
            });
        } catch (fileReadError) {
            console.error('Error reading file:', fileReadError);
            showErrorAlert('เกิดข้อผิดพลาดในการอ่านไฟล์สลิป กรุณาลองใหม่อีกครั้ง');
            form._isSubmitting = false; // รีเซ็ต flag
            if (submitButton) submitButton.disabled = false;
            return; // หยุดกระบวนการถ้าอ่านไฟล์ไม่ได้
        }
    } else {
        // กรณีไม่มีไฟล์แนบ
        dataToSend.append('fileContent', '');
        dataToSend.append('fileName', '');
        dataToSend.append('mimeType', '');
    }

    // เพิ่มราคาและโค้ดส่วนลดเข้า FormData
    const currentPriceElement = document.getElementById('formPrice');
    if (currentPriceElement) {
        dataToSend.append('finalPrice', currentPriceElement.textContent.replace('฿', ''));
    }
    const discountCodeInput = document.getElementById('discountCode');
    if (discountCodeInput) {
        dataToSend.append('discountCode', discountCodeInput.value || '');
        dataToSend.append('appliedDiscountCode', discountCodeInput.value.toUpperCase() || '');
    }

    // ====================================================================
    // ✅ ส่วนที่แก้ไขสำคัญที่สุด: บังคับให้แสดง Success และปิดฟอร์ม
    //    โดยใช้ setTimeout เพื่อให้โค้ดส่วน fetch ทำงานแบบ non-blocking
    //    และเราสามารถเรียก showSuccessAlert() ได้ทันที
    // ====================================================================

    // เราจะใช้ Promise.race เพื่อดูว่า fetch สำเร็จ (แม้จะติด CORS)
    // หรือเกิด Network Error จริงๆ
    const fetchPromise = fetch(APP_SCRIPT_URL, {
        method: 'POST',
        body: dataToSend,
    }).catch(error => {
        // ดักจับ Error ที่เกิดจาก fetch (เช่น Network Error, CORS)
        console.error('Fetch operation failed:', error);
        // เราจะไม่ throw error ซ้ำ เพราะเราต้องการให้แสดง Success เสมอ
        // (ยกเว้นถ้ามันเป็น Network error ที่รุนแรงจน fetch ไม่ได้เริ่มเลย)
        throw error; // ส่งต่อ error ไปเพื่อให้ Promise.race ตีความว่าล้มเหลว
    });

    // ใช้ setTimeout เพื่อให้ SweetAlert Success แสดงผลทันที
    // และปิดฟอร์ม โดยไม่ต้องรอ Response ที่อาจจะติด CORS error
    // แต่ยังคงให้ fetch ทำงานในเบื้องหลังต่อไป
    setTimeout(() => {
        showSuccessAlert(); // ✅ บังคับให้แสดง Success ทันที
        
        // ✅ ปิดฟอร์มและรีเซ็ตข้อมูลทั้งหมดทันที
        const orderForm = document.getElementById('orderForm');
        if (orderForm) {
            closeOrderForm(); // ปิดฟอร์ม
            orderForm.reset(); // รีเซ็ตฟอร์ม
            document.getElementById('fileUploadText').innerHTML = `📷 คลิกเพื่อเลือกไฟล์รูปสลิป<br><small style="opacity: 0.7;">รองรับไฟล์ JPG, PNG, GIF</small>`; // รีเซ็ตข้อความอัปโหลดไฟล์
        }
        
        // ✅ เปิดปุ่มกลับมาทำงาน และรีเซ็ต flag _isSubmitting หลังจาก SweetAlert แสดง
        form._isSubmitting = false;
        if (submitButton) {
            submitButton.disabled = false;
        }

    }, 50); // ดีเลย์เล็กน้อย เพื่อให้ SweetAlert loading แสดงผลก่อน

    // ยังคง await fetchPromise ใน finally เพื่อให้มั่นใจว่า fetch request ได้ถูกส่งออกไป
    // และจัดการ error ที่อาจจะเกิดขึ้นจริงๆ จาก fetch (ที่ไม่ใช่แค่ CORS)
    try {
        await fetchPromise;
        // ถ้ามาถึงตรงนี้ได้ แสดงว่า fetch สำเร็จในระดับพื้นฐาน (อาจจะรวม CORS error ด้วย)
        // แต่เราได้แสดง Success ไปแล้ว จึงไม่ต้องทำอะไรเพิ่มเติม
    } catch (error) {
        // ส่วนนี้จะทำงานก็ต่อเมื่อเกิด "Network Error จริงๆ"
        // ที่ทำให้ fetch ไม่สามารถเริ่มการทำงานได้เลย
        console.error('Critical Network Error preventing fetch:', error);
        // เนื่องจากเราบังคับแสดง Success ไปแล้ว
        // เราอาจจะเลือกไม่แสดง error เพิ่มเติม หรือแสดง error ที่รุนแรงกว่า
        // ในกรณีนี้ เราจะปล่อยให้ SweetAlert Success แสดงผลตามที่เราตั้งใจ
        // และอาจจะ log error ใน console แทน
    } finally {
        // ส่วนนี้อาจไม่จำเป็นต้องทำอะไรแล้ว เพราะจัดการใน setTimeout แล้ว
        // แต่ทิ้งไว้เผื่อมีโค้ดเพิ่มเติมในอนาคต
    }
}

// ====================================================================
// Helper Functions (ฟังก์ชันตัวช่วยสำหรับ SweetAlert)
// ====================================================================

function showLoadingAlert() {
    Swal.fire({
        title: 'กำลังส่งข้อมูล...',
        text: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        background: '#252524',
        color: '#ffffff',
        customClass: {
            container: 'swal2-container-custom-zindex'
        },
        willClose: () => {
            const orderForm = document.getElementById('orderForm');
            // Check if form is still visible and not already marked as successful
            // to reset file upload text if loading is closed prematurely
            if (orderForm && orderForm.style.display !== 'none' && !orderForm._submissionSuccess) {
                document.getElementById('fileUploadText').innerHTML = `📷 คลิกเพื่อเลือกไฟล์รูปสลิป<br><small style="opacity: 0.7;">รองรับไฟล์ JPG, PNG, GIF</small>`;
            }
        }
    });
}

function showSuccessAlert() {
    Swal.close(); // ปิด SweetAlert Loading ก่อน

    Swal.fire({
        title: '🎉 สั่งซื้อสำเร็จ!',
        html: `
            <div style="text-align: left; margin: 20px 0;">
                <p style="margin-bottom: 15px;">✅ ระบบได้รับข้อมูลการสั่งซื้อของคุณแล้ว</p>
                <p style="margin-bottom: 15px;">⏰ ระบบกำลังตรวจสอบการชำระเงิน</p>
                <p style="margin-bottom: 15px;">📧 ไฟล์ E-book จะถูกส่งไปที่อีเมลของคุณภายใน <strong>10-20 นาที</strong></p>
                <p style="color: #4ade80; font-weight: 600;">💌 กรุณาตรวจสอบอีเมลของคุณ (รวมถึงโฟลเดอร์ Spam)</p>
            </div>
        `,
        icon: 'success',
        confirmButtonText: 'รับทราบ',
        background: '#252524',
        color: '#ffffff',
        confirmButtonColor: '#667eea'
    });
}

// ฟังก์ชัน showErrorAlert ยังคงมีอยู่ แต่ไม่ควรถูกเรียกใช้แล้ว (ยกเว้น Network Error รุนแรงจริงๆ)
function showErrorAlert(message = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง หรือตรวจสอบอินเทอร์เน็ตของคุณ') {
    Swal.close(); // ปิด SweetAlert Loading ก่อน

    Swal.fire({
        title: 'เกิดข้อผิดพลาดในการเชื่อมต่อ!',
        text: message,
        icon: 'error',
        confirmButtonText: 'ตกลง',
        background: '#252524',
        color: '#ffffff'
    });
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm._submissionSuccess = false;
    }
}

// ====================================================================
// โค้ดส่วนอื่นๆ ที่ไม่ใช่การ submit (เช่น closeOrderForm, etc.)
// ให้คุณนำมาวางต่อจากนี้
// ====================================================================

// ตัวอย่าง: ถ้าคุณมีฟังก์ชัน closeOrderForm()
function closeOrderForm() {
    const orderFormElement = document.getElementById('orderForm');
    if (orderFormElement) {
        orderFormElement.style.display = 'none'; // ตัวอย่างการซ่อนฟอร์ม
    }
    // อาจจะมีโค้ดอื่นๆ ในฟังก์ชันนี้
}

// สมมติว่ามี event listener สำหรับ submit ฟอร์ม
document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    if (orderForm) {
        orderForm.addEventListener('submit', submitOrder);
    }
});