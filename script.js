// Hamburger Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
}

// Close menu when a link is clicked
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Tracking Functionality
const trackBtn = document.getElementById('trackBtn');
const trackingInput = document.getElementById('trackingInput');
const trackingResult = document.getElementById('trackingResult');
const resultTitle = document.getElementById('resultTitle');
const resultMessage = document.getElementById('resultMessage');
const finalStep = document.getElementById('finalStep');
const finalStepText = document.getElementById('finalStepText');

if (trackBtn) {
    trackBtn.addEventListener('click', trackShipment);
    trackingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') trackShipment();
    });
}

function trackShipment() {
    const trackingNumber = trackingInput.value.trim();

    if (!trackingNumber) {
        alert('Please enter a tracking number');
        return;
    }

    // Validate tracking number format (TRK-XXXXX format from server)
    if (!trackingNumber.startsWith('TRK-') && !trackingNumber.startsWith('LF')) {
        alert('Invalid tracking number. Expected format: TRK-100001 or LF123456789');
        return;
    }

    // Try to fetch from server first
    if (trackingNumber.startsWith('TRK-')) {
        fetchTrackingFromServer(trackingNumber);
    } else {
        // Fallback for demo tracking numbers
        showDemoTracking(trackingNumber);
    }
}

async function fetchTrackingFromServer(trackingId) {
    try {
        const response = await fetch(`${SERVER_URL}/track/${trackingId}`);
        const data = await response.json();

        if (response.ok) {
            const tracking = data.tracking;
            
            // Display server tracking data
            resultTitle.textContent = `📦 Tracking #${trackingId}`;
            
            // Update final step based on status
            const status = tracking.status;
            if (status === 'Confirmed') {
                finalStep.classList.add('completed');
                finalStepText.textContent = 'Confirmed & Processing';
            } else if (status === 'Delivered') {
                finalStep.classList.add('completed');
                finalStepText.textContent = 'Delivered';
            } else if (status === 'Out for Delivery') {
                finalStepText.textContent = 'Out for Delivery';
            } else if (status === 'Pending') {
                finalStepText.textContent = '⏳ Pending Confirmation';
            } else {
                finalStepText.textContent = 'In Transit';
            }
            
            // Create detailed message with all information
            let message = `
                <div style="text-align: left; background: white; padding: 20px; border-radius: 10px; margin-top: 15px;">
                    <div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #667eea; border-radius: 5px;">
                        <p><strong>📦 Order Details</strong></p>
                        <p style="margin: 8px 0;">Order ID: <strong>${tracking.orderId}</strong></p>
                        <p style="margin: 8px 0;">Service: <strong>${tracking.service}</strong></p>
                        <p style="margin: 8px 0;">Price: <strong>${tracking.priceRange || 'Standard'}</strong></p>
                        <p style="margin: 8px 0;">Created: <strong>${new Date(tracking.createdAt).toLocaleDateString()}</strong></p>
                    </div>
                    
                    <div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #ff9800; border-radius: 5px;">
                        <p><strong>📍 Status: <span style="color: ${status === 'Confirmed' ? '#4caf50' : status === 'Pending' ? '#ff9800' : '#2196f3'}">${status}</span></strong></p>
                        <p style="margin: 8px 0; font-size: 12px;">Last updated: ${new Date(tracking.createdAt).toLocaleString()}</p>
                    </div>
                    
                    <div style="margin: 15px 0; padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 5px;">
                        <p><strong>📤 From (Sender)</strong></p>
                        <p style="margin: 5px 0; line-height: 1.6;">${tracking.senderAddress}</p>
                    </div>
                    
                    <div style="margin: 15px 0; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 5px;">
                        <p><strong>📥 To (Receiver)</strong></p>
                        <p style="margin: 5px 0; line-height: 1.6;">${tracking.receiverAddress}</p>
                    </div>
                    
                    ${tracking.pictureUrl ? `
                    <div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-left: 4px solid #9c27b0; border-radius: 5px;">
                        <p><strong>📸 Package Picture</strong></p>
                        <img src="${tracking.pictureUrl}" alt="Package" style="max-width: 100%; max-height: 250px; margin-top: 10px; border-radius: 5px; cursor: pointer;" onclick="openImageModal('${tracking.pictureUrl}')">
                    </div>
                    ` : ''}
                </div>
            `;
            resultMessage.innerHTML = message;
        } else {
            alert(data.error || 'Tracking number not found');
            return;
        }
    } catch (error) {
        console.error('Tracking error:', error);
        alert('Could not fetch tracking information from server');
        return;
    }

    trackingResult.classList.add('active');
    trackingResult.scrollIntoView({ behavior: 'smooth' });
}

// Image Modal Functions
function openImageModal(imagePath) {
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    if (imageModal && modalImage) {
        modalImage.src = imagePath;
        imageModal.classList.remove('image-modal-hidden');
        imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageModal() {
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.classList.add('image-modal-hidden');
        imageModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close image modal when clicking outside
window.addEventListener('click', (event) => {
    const imageModal = document.getElementById('imageModal');
    if (imageModal && event.target === imageModal) {
        closeImageModal();
    }
});

// Close image modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const imageModal = document.getElementById('imageModal');
        if (imageModal && !imageModal.classList.contains('image-modal-hidden')) {
            closeImageModal();
        }
    }
});

function showDemoTracking(trackingNumber) {
    // Fallback demo tracking for testing
    const trackingData = {
        status: 'In Transit',
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        carrier: 'LogiFlow Express'
    };

    // Display results
    resultTitle.textContent = `Tracking #${trackingNumber}`;
    resultMessage.textContent = `Status: ${trackingData.status} | Estimated Delivery: ${trackingData.estimatedDelivery}`;
    
    // Determine final step based on status
    if (trackingData.status === 'Delivered') {
        finalStep.classList.add('completed');
        finalStepText.textContent = 'Delivered';
    } else if (trackingData.status === 'Out for Delivery') {
        finalStepText.textContent = 'Out for Delivery';
    } else {
        finalStepText.textContent = 'Arriving Soon';
    }

    trackingResult.classList.add('active');
    trackingResult.scrollIntoView({ behavior: 'smooth' });
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const subject = contactForm.querySelectorAll('input[type="text"]')[1].value;
        const message = contactForm.querySelector('textarea').value;

        // Validate form
        if (!name || !email || !subject || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Simulate form submission
        console.log('Form Data:', { name, email, subject, message });
        
        // Show success message
        alert(`Thank you, ${name}! Your message has been sent successfully. We'll contact you soon.`);
        
        // Reset form
        contactForm.reset();
    });
}

// Smooth scroll behavior for CTA button
const ctaButton = document.querySelector('.hero .btn-primary');
if (ctaButton) {
    ctaButton.addEventListener('click', () => {
        document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
    });
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = 'var(--box-shadow)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and testimonial cards
document.querySelectorAll('.service-card, .testimonial-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(card);
});

// Initialize AOS-like effect
document.addEventListener('DOMContentLoaded', () => {
    // Add animation to stat boxes
    const statBoxes = document.querySelectorAll('.stat-box');
    statBoxes.forEach((box, index) => {
        box.style.opacity = '0';
        box.style.animation = `slideIn 0.6s ease-out ${index * 0.1}s forwards`;
    });
});

// Add keyframe animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Active link highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-menu a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.style.color = 'var(--text-dark)';
        if (link.getAttribute('href') === '#' + current) {
            link.style.color = 'var(--primary-color)';
        }
    });
});

// Get Started button scroll
if (ctaButton) {
    ctaButton.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('services').scrollIntoView({ behavior: 'smooth' });
    });
}

// Quote Form Functions - Multi-Step Flow
function openQuoteForm(serviceName, price) {
    // Check if user is registered/logged in
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        alert('⚠️ Registration Required!\n\nYou must register and login to place an order.\n\n1. Click "Register" button in the top menu\n2. Create your account\n3. Login with your credentials\n4. Then you can place an order');
        
        // Open the registration modal
        const registerModal = document.getElementById('registerModal');
        if (registerModal) {
            registerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        return;
    }

    const modal = document.getElementById('quoteModal');
    const serviceNameField = document.getElementById('serviceName');
    const servicePriceField = document.getElementById('servicePrice');

    if (modal && serviceNameField && servicePriceField) {
        serviceNameField.value = serviceName;
        servicePriceField.value = price;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Show step 1 (quote form)
        showQuoteStep();
    }
}

// Multi-Step Form Navigation
function showQuoteStep() {
    const quoteFormStep = document.getElementById('quoteFormStep');
    const uploadStep = document.getElementById('uploadStep');
    const submitStep = document.getElementById('submitStep');
    
    if (quoteFormStep) quoteFormStep.style.display = 'block';
    if (uploadStep) uploadStep.style.display = 'none';
    if (submitStep) submitStep.style.display = 'none';
}

function proceedToUploadStep() {
    // Validate quote form
    const senderName = document.getElementById('senderName').value.trim();
    const senderEmail = document.getElementById('senderEmail').value.trim();
    const senderPhone = document.getElementById('senderPhone').value.trim();
    const senderAddress = document.getElementById('senderAddress').value.trim();
    const receiverName = document.getElementById('receiverName').value.trim();
    const receiverEmail = document.getElementById('receiverEmail').value.trim();
    const receiverPhone = document.getElementById('receiverPhone').value.trim();
    const receiverAddress = document.getElementById('receiverAddress').value.trim();

    // Validate all required fields
    if (!senderName || !senderEmail || !senderPhone || !senderAddress) {
        alert('Please fill in all sender address fields');
        return;
    }
    if (!receiverName || !receiverEmail || !receiverPhone || !receiverAddress) {
        alert('Please fill in all receiver address fields');
        return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
        alert('Please enter a valid sender email address');
        return;
    }
    if (!emailRegex.test(receiverEmail)) {
        alert('Please enter a valid receiver email address');
        return;
    }

    // Validate phones
    if (senderPhone.length < 10) {
        alert('Please enter a valid sender phone number');
        return;
    }
    if (receiverPhone.length < 10) {
        alert('Please enter a valid receiver phone number');
        return;
    }

    // Store form data
    window.multiStepFormData = {
        serviceName: document.getElementById('serviceName').value,
        servicePrice: document.getElementById('servicePrice').value,
        senderName,
        senderEmail,
        senderPhone,
        senderAddress,
        receiverName,
        receiverEmail,
        receiverPhone,
        receiverAddress,
        message: document.getElementById('message').value.trim()
    };

    // Show upload step
    const quoteFormStep = document.getElementById('quoteFormStep');
    const uploadStep = document.getElementById('uploadStep');
    if (quoteFormStep) quoteFormStep.style.display = 'none';
    if (uploadStep) uploadStep.style.display = 'block';
}

function backToQuoteStep() {
    const quoteFormStep = document.getElementById('quoteFormStep');
    const uploadStep = document.getElementById('uploadStep');
    if (quoteFormStep) quoteFormStep.style.display = 'block';
    if (uploadStep) uploadStep.style.display = 'none';
}

function backToUploadStep() {
    const uploadStep = document.getElementById('uploadStep');
    const submitStep = document.getElementById('submitStep');
    if (uploadStep) uploadStep.style.display = 'block';
    if (submitStep) submitStep.style.display = 'none';
}

// Handle quote upload form submission
const quoteUploadForm = document.getElementById('quoteUploadForm');
if (quoteUploadForm) {
    quoteUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const pic1 = document.getElementById('quotePic1').files[0];
        const pic2 = document.getElementById('quotePic2').files[0];
        const pic3 = document.getElementById('quotePic3').files[0];

        if (!pic1 || !pic2 || !pic3) {
            alert('Please upload all 3 pictures');
            return;
        }

        // Store pictures in window object for final submission
        window.multiStepFormData.pictures = {
            pic1, pic2, pic3
        };

        // Move to final submission step
        const uploadStep = document.getElementById('uploadStep');
        const submitStep = document.getElementById('submitStep');
        if (uploadStep) uploadStep.style.display = 'none';
        if (submitStep) submitStep.style.display = 'block';
    });
}

// File preview for quote form upload
['quotePic1', 'quotePic2', 'quotePic3'].forEach((inputId, index) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('change', (e) => {
            const previewId = `quotePic${index + 1}Preview`;
            const previewDiv = document.getElementById(previewId);
            
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    if (previewDiv) previewDiv.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
});

// Final submit function
async function submitQuoteWithPicture() {
    // Require login: use currentUser from localStorage and prevent submission if missing
    const savedUser = localStorage.getItem('currentUser');
    const loggedUser = savedUser ? JSON.parse(savedUser) : null;
    if (!loggedUser || !loggedUser.email) {
        alert('Please login or register before submitting an order.');
        if (typeof openLoginModal === 'function') openLoginModal();
        return;
    }

    if (!window.multiStepFormData) {
        alert('Form data not found. Please try again.');
        return;
    }

    // Immediately show confirmation and redirect to home (user requested immediate navigation)
    try {
        showToast('✅ Your order has been sent. Redirecting to home...', 2500);
        setTimeout(() => { window.location.href = '/'; }, 2000);
    } catch (e) {
        console.error('Immediate redirect toast failed:', e);
    }

    const formData = window.multiStepFormData;
    const { pic1, pic2, pic3 } = formData.pictures || {};

    try {
        // Create FormData with file and order details
        const submitFormData = new FormData();
        
        // Server expects a single file field named 'packagePicture'
        if (pic1) {
            submitFormData.append('packagePicture', pic1);
        } else if (pic2) {
            submitFormData.append('packagePicture', pic2);
        } else if (pic3) {
            submitFormData.append('packagePicture', pic3);
        }
        
        // Use the logged-in user's email to ensure server user lookup succeeds
        submitFormData.append('email', loggedUser.email || formData.senderEmail || '');
        submitFormData.append('service', formData.serviceName);
        submitFormData.append('priceRange', formData.servicePrice);
        submitFormData.append('specialRequirements', formData.message);
        submitFormData.append('senderAddress', `${formData.senderName}, ${formData.senderPhone}\n${formData.senderAddress}`);
        submitFormData.append('receiverAddress', `${formData.receiverName}, ${formData.receiverPhone}\n${formData.receiverAddress}`);

        // Submit to server
        const response = await fetch(`${SERVER_URL}/create-order`, {
            method: 'POST',
            body: submitFormData
        });

        // Safely parse response: if server returns HTML (e.g. error page), avoid json() crash
        let data;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response from /create-order', response.status, text);
            alert('Error creating order. Server returned non-JSON response — check console network tab.');
            return;
        }

        if (!response.ok) {
            alert(data.error || 'Failed to create order. Please try again.');
            return;
        }

        // Show immediate, non-blocking confirmation that the order was received
        if (typeof showToast === 'function') {
            showToast('✅ Your order has been sent. Pending admin confirmation.');
        } else {
            // Fallback quick message
            console.log('Order accepted by server:', data.order && data.order.trackingId);
        }

        // Send confirmation email to user
        await sendOrderConfirmationEmail({
            recipientEmail: loggedUser.email,
            senderName: formData.senderName,
            trackingId: data.order.trackingId,
            service: formData.serviceName,
            orderDetails: {
                from: formData.senderAddress,
                to: formData.receiverAddress,
                special: formData.message
            }
        });

        // Send admin notification email
        await sendAdminNotificationEmail({
            service: formData.serviceName,
            trackingId: data.order.trackingId,
            senderEmail: loggedUser.email,
            senderName: formData.senderName
        });

        // Show success message
        alert(`✅ Order submitted successfully!\n\n⏳ STATUS: PENDING CONFIRMATION\n\nYour package pictures have been uploaded. Our admin team will review and confirm your order within 2-4 hours.\n\n📦 Tracking ID: ${data.order.trackingId}\n\nA confirmation email has been sent to ${formData.senderEmail}.\n\nYou will receive another email once your order is confirmed.`);

        // Close quote form and reset
        closeQuoteForm();
        resetQuoteForm();

    } catch (error) {
        console.error('Error creating order:', error);
        alert(`⚠️ Error creating order.\n\n${error.message}\n\nPlease try again.`);
    }
}

function resetQuoteForm() {
    const quoteForm = document.getElementById('quoteForm');
    const quoteUploadForm = document.getElementById('quoteUploadForm');
    
    if (quoteForm) quoteForm.reset();
    if (quoteUploadForm) quoteUploadForm.reset();
    
    // Reset previews
    ['quotePic1', 'quotePic2', 'quotePic3'].forEach((_, index) => {
        const previewId = `quotePic${index + 1}Preview`;
        const previewDiv = document.getElementById(previewId);
        if (previewDiv) previewDiv.innerHTML = '';
    });
    
    // Reset steps
    showQuoteStep();
    
    // Clear stored data
    window.multiStepFormData = null;
}

// Lightweight toast helper for non-blocking messages
function showToast(message, duration = 4000) {
    try {
        const existing = document.getElementById('app-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.85)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
            zIndex: 9999,
            fontSize: '14px'
        });
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 300ms ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    } catch (e) {
        console.error('Toast error', e);
    }
}

// Email sending functions
async function sendOrderConfirmationEmail(emailData) {
    try {
        const response = await fetch(`${SERVER_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: emailData.recipientEmail,
                subject: `🎉 Order Confirmation - Tracking ID: ${emailData.trackingId}`,
                type: 'order_confirmation',
                data: {
                    senderName: emailData.senderName,
                    trackingId: emailData.trackingId,
                    service: emailData.service,
                    from: emailData.orderDetails.from,
                    to: emailData.orderDetails.to,
                    special: emailData.orderDetails.special
                }
            })
        });

        if (response.ok) {
            console.log('✓ Confirmation email sent to:', emailData.recipientEmail);
        } else {
            console.warn('Failed to send confirmation email');
        }
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

async function sendAdminNotificationEmail(emailData) {
    try {
        const response = await fetch(`${SERVER_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: 'support@logiflow.com',
                subject: `📦 New Order Received - ${emailData.trackingId}`,
                type: 'admin_notification',
                data: {
                    service: emailData.service,
                    trackingId: emailData.trackingId,
                    senderEmail: emailData.senderEmail,
                    senderName: emailData.senderName
                }
            })
        });

        if (response.ok) {
            console.log('✓ Admin notification email sent');
        } else {
            console.warn('Failed to send admin notification');
        }
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}

function closeQuoteForm() {
    const modal = document.getElementById('quoteModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Close modal when clicking outside the content
window.addEventListener('click', (event) => {
    const modal = document.getElementById('quoteModal');
    if (modal && event.target === modal) {
        closeQuoteForm();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const quoteModal = document.getElementById('quoteModal');
        const uploadModal = document.getElementById('uploadModal');
        
        if (quoteModal && quoteModal.classList.contains('active')) {
            closeQuoteForm();
        } else if (uploadModal && uploadModal.classList.contains('active')) {
            closeUploadForm();
        }
    }
});

// Upload Form Functions
// Show a custom upload prompt modal (replaces alert) and open upload modal when user clicks Upload
function showUploadPromptModal({ title = 'Upload', message = '' } = {}) {
    let existing = document.getElementById('confirmUploadModal');
    if (!existing) {
        existing = document.createElement('div');
        existing.id = 'confirmUploadModal';
        existing.className = 'confirm-upload-modal';
        existing.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-title">${title}</div>
                <div class="confirm-body">${message}</div>
                <div class="confirm-actions">
                    <button class="btn btn-secondary" id="confirmUploadCancel">Cancel</button>
                    <button class="btn btn-primary" id="confirmUploadOpen">Upload Package Picture</button>
                </div>
            </div>
        `;
        document.body.appendChild(existing);

        // Click outside to close
        existing.addEventListener('click', (e) => {
            if (e.target === existing) {
                existing.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });

        // Wire buttons after appended
        existing.querySelector('#confirmUploadCancel').addEventListener('click', () => {
            existing.classList.remove('active');
            document.body.style.overflow = 'auto';
        });

        existing.querySelector('#confirmUploadOpen').addEventListener('click', () => {
            // Show camera/gallery selection for mobile
            showCameraGalleryOptions();
            existing.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    } else {
        // update content
        const titleEl = existing.querySelector('.confirm-title');
        const bodyEl = existing.querySelector('.confirm-body');
        if (titleEl) titleEl.textContent = title;
        if (bodyEl) bodyEl.textContent = message;
    }

    // Show it
    existing.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function openUploadForm() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeUploadForm() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    // Reset upload form
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.reset();
        document.getElementById('pic1Preview').innerHTML = '';
        document.getElementById('pic2Preview').innerHTML = '';
        document.getElementById('pic3Preview').innerHTML = '';
    }
}

// Show camera/gallery selection modal on mobile
function showCameraGalleryOptions() {
    let optionsModal = document.getElementById('cameraGalleryModal');
    if (!optionsModal) {
        optionsModal = document.createElement('div');
        optionsModal.id = 'cameraGalleryModal';
        optionsModal.className = 'camera-gallery-modal';
        optionsModal.innerHTML = `
            <div class="camera-gallery-content">
                <h3>📸 Choose Source</h3>
                <p>Select how you want to upload your package picture:</p>
                <div class="camera-gallery-buttons">
                    <button class="btn btn-camera" id="cameraBtn" onclick="openCameraCapture()">
                        <span>📷</span>
                        <span>Camera</span>
                    </button>
                    <button class="btn btn-gallery" id="galleryBtn" onclick="openGallerySelect()">
                        <span>🖼️</span>
                        <span>Photo Gallery</span>
                    </button>
                </div>
                <button class="btn btn-secondary" id="cancelCameraGallery" onclick="closeCameraGalleryModal()">Cancel</button>
            </div>
        `;
        document.body.appendChild(optionsModal);
        
        // Close on background click
        optionsModal.addEventListener('click', (e) => {
            if (e.target === optionsModal) {
                closeCameraGalleryModal();
            }
        });
    }
    optionsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCameraGalleryModal() {
    const Modal = document.getElementById('cameraGalleryModal');
    if (Modal) {
        Modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Open camera capture
function openCameraCapture() {
    closeCameraGalleryModal();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment'; // Back camera
    fileInput.onchange = handlePictureCapture;
    fileInput.click();
}

// Open gallery selection
function openGallerySelect() {
    closeCameraGalleryModal();
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = handlePictureCapture;
    fileInput.click();
}

// Handle picture capture from camera or gallery
function handlePictureCapture(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected. Please upload a package picture.');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    // Open upload form and show this picture
    openUploadForm();
}

// Close upload modal when clicking outside
document.addEventListener('click', (event) => {
    const uploadModal = document.getElementById('uploadModal');
    if (uploadModal && event.target === uploadModal) {
        closeUploadForm();
    }
});

// File preview functionality
['packagePic1', 'packagePic2', 'packagePic3'].forEach((inputId, index) => {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('change', (e) => {
            const previewId = `pic${index + 1}Preview`;
            const previewDiv = document.getElementById(previewId);
            
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    previewDiv.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
});

// Handle upload form submission
const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const pic1 = document.getElementById('packagePic1').files[0];
        const pic2 = document.getElementById('packagePic2').files[0];
        const pic3 = document.getElementById('packagePic3').files[0];

        if (!pic1 || !pic2 || !pic3) {
            alert('Please upload all 3 pictures');
            return;
        }

        // Log upload data
        const fullName = window.quoteFormData?.fullName || 'Customer';
        console.log('Package Pictures Uploaded:', {
            pic1: pic1.name,
            pic2: pic2.name,
            pic3: pic3.name,
            customerName: fullName,
            timestamp: new Date().toLocaleString()
        });

        // Display success message
        alert(`Thank you, ${fullName}!\n\nYour package pictures have been uploaded successfully.\n\nWe will process your shipment shortly and send you a confirmation email with your tracking number.`);

        // Reset form and close modal
        uploadForm.reset();
        document.getElementById('pic1Preview').innerHTML = '';
        document.getElementById('pic2Preview').innerHTML = '';
        document.getElementById('pic3Preview').innerHTML = '';
        closeUploadForm();
    });
}

// Server Configuration
const SERVER_URL = 'https://logistic-web-6fxn.onrender.com/api';

// User Menu and Auth Functions
let currentUser = null;

// Load user from localStorage on page load
function initializeUserSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUserMenu();
            console.log('✓ User session restored:', currentUser.name);
        } catch (error) {
            console.error('Error loading saved user:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

// Initialize user session when page loads
function startInitialization() {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
        initializeUserSession();
    });
}

document.addEventListener('DOMContentLoaded', startInitialization);

// Also try initializing if DOM is already loaded (for inline scripts)
if (document.readyState === 'complete') {
    startInitialization();
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    const userBtn = document.querySelector('.user-icon-btn');
    
    if (dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    } else {
        // Position the dropdown below the user icon
        const rect = userBtn.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 10) + 'px';
        dropdown.classList.add('active');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const userBtn = document.querySelector('.user-icon-btn');
    const userWrapper = document.querySelector('.user-menu-wrapper');
    
    if (dropdown && !userWrapper.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

function openLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function switchToRegister(e) {
    e.preventDefault();
    closeLoginModal();
    openRegisterModal();
}

function switchToLogin(e) {
    e.preventDefault();
    closeRegisterModal();
    openLoginModal();
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeOrdersModal() {
    document.getElementById('ordersModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function closeNotificationsModal() {
    document.getElementById('notificationsModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Handle login form submission
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        
        try {
            const response = await fetch(`${SERVER_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = {
                    name: data.user.name,
                    email: data.user.email
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                closeLoginModal();
                updateUserMenu();
                
                // Clear form
                loginForm.reset();
                alert(`Welcome back, ${currentUser.name}!`);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Connection error. Make sure the API at https://logistic-web-6fxn.onrender.com is reachable');
        }
    });
}

// Handle register form submission
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        
        // Validate all fields are filled
        if (!name || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }
        
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch(`${SERVER_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    registerName: name,
                    registerEmail: email,
                    registerPassword: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = {
                    name: data.user.name,
                    email: data.user.email
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                closeRegisterModal();
                updateUserMenu();
                
                // Clear form
                registerForm.reset();
                alert(`Welcome to LogiFlow, ${name}!\n\nA welcome email with your tracking number has been sent to ${email}`);
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Register error:', error);
            alert('Connection error. Make sure the API at https://logistic-web-6fxn.onrender.com is reachable');
        }
    });
}

function updateUserMenu() {
    const authSection = document.getElementById('authSection');
    const userSection = document.getElementById('userSection');
    
    // Check if elements exist before trying to modify them
    if (!authSection || !userSection) {
        return;
    }
    
    if (currentUser) {
        authSection.classList.add('hidden');
        userSection.classList.remove('hidden');
    } else {
        authSection.classList.remove('hidden');
        userSection.classList.add('hidden');
    }
}

function showProfile(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    document.getElementById('profileName').textContent = currentUser.name || '-';
    document.getElementById('profileEmail').textContent = currentUser.email || '-';
    document.getElementById('profilePhone').textContent = currentUser.phone || '-';
    
    document.getElementById('profileModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

function showOrders(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    // Fetch orders from server
    fetchOrders();
    
    document.getElementById('ordersModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

async function fetchOrders() {
    try {
        const response = await fetch(`${SERVER_URL}/orders/${currentUser.email}`);
        const data = await response.json();

        const ordersContainer = document.getElementById('ordersList');
        if (!ordersContainer) return;

        ordersContainer.innerHTML = '';

        if (data.orders && data.orders.length > 0) {
            data.orders.forEach(order => {
                const orderDiv = document.createElement('div');
                orderDiv.style.cssText = 'background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1e88e5;';
                orderDiv.innerHTML = `
                    <p style="margin: 5px 0; font-weight: bold; color: #1e88e5;">Order ID: ${order.id}</p>
                    <p style="margin: 5px 0;"><strong>Service:</strong> ${order.service}</p>
                    <p style="margin: 5px 0;"><strong>Tracking:</strong> ${order.trackingId}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ff6f00; font-weight: bold;">${order.status}</span></p>
                    <p style="margin: 5px 0; font-size: 0.9em; color: #666;">${new Date(order.createdAt).toLocaleDateString()}</p>
                `;
                ordersContainer.appendChild(orderDiv);
            });
        } else {
            ordersContainer.innerHTML = '<p style="color: #666; text-align: center;">No orders yet. Create one to get started!</p>';
        }
    } catch (error) {
        console.error('Fetch orders error:', error);
        alert('Could not fetch orders from server');
    }
}

function showNotifications(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    
    // Fetch notifications from server
    fetchNotifications();
    
    document.getElementById('notificationsModal').classList.add('active');
    document.getElementById('userDropdown').classList.remove('active');
    document.body.style.overflow = 'hidden';
}

// Add 'filled' class to form controls that contain user input so CSS can style them
document.addEventListener('DOMContentLoaded', () => {
    const selector = 'form input, form textarea, form select';
    const formControls = Array.from(document.querySelectorAll(selector));

    function shouldIgnore(el) {
        if (!el) return true;
        const t = el.type ? el.type.toLowerCase() : '';
        return ['file', 'checkbox', 'radio', 'submit', 'button', 'hidden'].includes(t) || el.disabled || el.readOnly;
    }

    function updateFilled(el) {
        if (shouldIgnore(el)) return;
        const val = (el.value || '').toString();
        if (val.trim() !== '') {
            el.classList.add('filled');
        } else {
            el.classList.remove('filled');
        }
    }

    formControls.forEach(el => {
        if (shouldIgnore(el)) return;
        // initialize state
        updateFilled(el);
        // listen for changes
        el.addEventListener('input', () => updateFilled(el));
        el.addEventListener('change', () => updateFilled(el));
        el.addEventListener('blur', () => updateFilled(el));
    });
});

async function fetchNotifications() {
    try {
        const response = await fetch(`${SERVER_URL}/notifications/${currentUser.email}`);
        const data = await response.json();

        const notificationsContainer = document.getElementById('notificationsList');
        if (!notificationsContainer) return;

        notificationsContainer.innerHTML = '';

        if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach(notif => {
                const notifDiv = document.createElement('div');
                notifDiv.style.cssText = 'background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #ff6f00; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';
                notifDiv.innerHTML = `
                    <p style="margin: 5px 0; font-weight: bold; color: #333;">${notif.title}</p>
                    <p style="margin: 5px 0; color: #666;">${notif.message}</p>
                    <p style="margin: 5px 0; font-size: 0.85em; color: #999;">${new Date(notif.timestamp).toLocaleString()}</p>
                `;
                notificationsContainer.appendChild(notifDiv);
            });
        } else {
            notificationsContainer.innerHTML = '<p style="color: #666; text-align: center;">No notifications yet. You will receive updates about your orders here!</p>';
        }
    } catch (error) {
        console.error('Fetch notifications error:', error);
        alert('Could not fetch notifications from server');
    }
}

function editProfile() {
    alert('Edit profile feature coming soon!');
}

function logout(e) {
    e.preventDefault();
    const name = currentUser.name;
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserMenu();
    document.getElementById('userDropdown').classList.remove('active');
    alert(`Goodbye, ${name}! You have been logged out.`);
}

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('registerModal').classList.remove('active');
        document.getElementById('profileModal').classList.remove('active');
        document.getElementById('ordersModal').classList.remove('active');
        document.getElementById('notificationsModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Close modals when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});

console.log('LogiFlow Website Initialized Successfully!');
