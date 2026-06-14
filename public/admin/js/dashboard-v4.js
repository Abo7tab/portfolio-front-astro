document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Navigation
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const page = link.dataset.page;
            loadPage(page);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            API.logout();
        });
    }

    // Initial load
    loadPage('home');
});

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const interval = Math.floor(seconds / 31536000);

    if (interval > 1) return interval + " years ago";
    if (interval === 1) return interval + " year ago";
    const months = Math.floor(seconds / 2628000);
    if (months > 1) return months + " months ago";
    if (months === 1) return months + " month ago";
    const days = Math.floor(seconds / 86400);
    if (days > 1) return days + " days ago";
    if (days === 1) return days + " day ago";
    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return hours + " hours ago";
    if (hours === 1) return hours + " hour ago";
    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return minutes + " minutes ago";
    if (minutes === 1) return minutes + " minute ago";
    return "Just now";
}

async function loadPage(page) {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center mt-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

    try {
        switch (page) {
            case 'home': {
                content.innerHTML = '';

                const homeTitle = document.createElement('h2');
                homeTitle.textContent = 'Dashboard Overview';
                content.appendChild(homeTitle);

                const statsRow = document.createElement('div');
                statsRow.className = 'row mt-4';
                const statCards = [
                    { id: 'dash-visits-count', label: 'Total Visits', color: 'bg-info' },
                    { id: 'dash-unique-count', label: 'Unique Visitors', color: 'bg-secondary' },
                    { id: 'dash-projects-count', label: 'Projects', color: 'bg-primary' },
                    { id: 'dash-skills-count', label: 'Skills', color: 'bg-success' },
                ];
                statCards.forEach(card => {
                    statsRow.innerHTML += `
                        <div class="col-md-3">
                            <div class="card text-white ${card.color} mb-3">
                                <div class="card-header">${card.label}</div>
                                <div class="card-body">
                                    <h3 class="card-title" id="${card.id}">...</h3>
                                </div>
                            </div>
                        </div>`;
                });
                content.appendChild(statsRow);

                const tableCard = document.createElement('div');
                tableCard.className = 'card mt-4';
                tableCard.innerHTML = `
                    <div class="card-header">Recent Visitors</div>
                    <div class="card-body p-0">
                        <table class="table table-sm table-hover mb-0">
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>Device / OS</th>
                                    <th>Browser</th>
                                    <th>Path</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody id="recent-visits-tbody">
                                <tr><td colspan="5" class="text-center p-3">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>`;
                content.appendChild(tableCard);

                try {
                    const statsRes = await API.getDashboardStats();
                    const stats = statsRes.data;

                    document.getElementById('dash-visits-count').textContent = stats.counts.visits;
                    document.getElementById('dash-unique-count').textContent = stats.counts.unique_visitors;
                    document.getElementById('dash-projects-count').textContent = stats.counts.projects;
                    document.getElementById('dash-skills-count').textContent = stats.counts.skills;

                    const tbody = document.getElementById('recent-visits-tbody');
                    tbody.innerHTML = '';

                    if (stats.recent_visits && stats.recent_visits.length > 0) {
                        stats.recent_visits.forEach(v => {
                            const tr = document.createElement('tr');

                            const tdIp = document.createElement('td');
                            tdIp.textContent = v.ip || '-';

                            const tdDevice = document.createElement('td');
                            tdDevice.textContent = (v.device || '-') + ' / ' + (v.os || '-');

                            const tdBrowser = document.createElement('td');
                            tdBrowser.textContent = v.browser || '-';

                            const tdPath = document.createElement('td');
                            const code = document.createElement('code');
                            code.textContent = v.path || '-';
                            tdPath.appendChild(code);

                            const tdTime = document.createElement('td');
                            tdTime.textContent = v.time_humans || (v.time ? timeAgo(v.time) : '-');

                            tr.appendChild(tdIp);
                            tr.appendChild(tdDevice);
                            tr.appendChild(tdBrowser);
                            tr.appendChild(tdPath);
                            tr.appendChild(tdTime);
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-3">No visits recorded yet.</td></tr>';
                    }

                } catch (e) {
                    console.error('Failed to load dashboard stats', e);
                    document.getElementById('dash-visits-count').textContent = '-';
                    document.getElementById('dash-unique-count').textContent = '-';
                }
                break;
            }

            case 'projects': await renderProjects(content); break;
            case 'skills': await renderSkills(content); break;
            case 'certificates': await renderCertificates(content); break;
            case 'profile': await renderProfile(content); break;
        }
    } catch (error) {
        content.innerHTML = '<div class="alert alert-danger">Error loading page: ' + error.message + '</div>';
    }
}

// =============================================
// --- Projects ---
// =============================================
async function renderProjects(container) {
    const response = await API.getProjects();
    const projects = response.data || [];

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-4';
    const h2 = document.createElement('h2');
    h2.className = 'mb-0';
    h2.textContent = 'Projects';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '+ Add New Project';
    addBtn.onclick = () => showProjectModal();
    header.appendChild(h2);
    header.appendChild(addBtn);
    container.appendChild(header);

    if (projects.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'alert alert-info';
        empty.textContent = 'No projects yet. Add your first project!';
        container.appendChild(empty);
        return;
    }

    const row = document.createElement('div');
    row.className = 'row g-3';

    projects.forEach(p => {
        const imgSrc = p.image_url || 'https://via.placeholder.com/400x200?text=No+Image';

        const col = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'card-img-top';
        img.style.height = '180px';
        img.style.objectFit = 'cover';
        card.appendChild(img);

        const body = document.createElement('div');
        body.className = 'card-body d-flex flex-column';

        const title = document.createElement('h5');
        title.className = 'card-title fw-bold';
        title.textContent = p.title;
        body.appendChild(title);

        if (p.description) {
            const desc = document.createElement('p');
            desc.className = 'card-text text-muted small';
            desc.textContent = p.description.length > 80 ? p.description.substring(0, 80) + '...' : p.description;
            body.appendChild(desc);
        }

        const badges = document.createElement('div');
        badges.className = 'mb-3 d-flex flex-wrap gap-1';

        const liveBadge = document.createElement('span');
        liveBadge.className = p.is_active ? 'badge bg-success' : 'badge bg-secondary';
        liveBadge.textContent = p.is_active ? '🟢 Live' : '⚫ Offline';
        badges.appendChild(liveBadge);

        if (p.live_link) {
            const liveLink = document.createElement('a');
            liveLink.href = p.live_link;
            liveLink.target = '_blank';
            liveLink.className = 'badge bg-primary text-decoration-none';
            liveLink.textContent = '🌐 Visit Site';
            badges.appendChild(liveLink);
        }

        if (p.github_link) {
            const ghLink = document.createElement('a');
            ghLink.href = p.github_link;
            ghLink.target = '_blank';
            ghLink.className = 'badge bg-dark text-decoration-none';
            ghLink.textContent = '💻 Source Code';
            badges.appendChild(ghLink);
        }

        body.appendChild(badges);

        const actions = document.createElement('div');
        actions.className = 'mt-auto d-flex gap-2';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-primary flex-fill';
        editBtn.textContent = '✏️ Edit';
        editBtn.onclick = () => showProjectModal(p);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline-danger flex-fill';
        deleteBtn.textContent = '🗑️ Delete';
        deleteBtn.onclick = () => deleteProject(p.id);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        body.appendChild(actions);

        card.appendChild(body);
        col.appendChild(card);
        row.appendChild(col);
    });

    container.appendChild(row);
}

// Global helper: create a new category from within the project modal
window.addNewCategory = async () => {
    const name = prompt('New category name:');
    if (!name || !name.trim()) return;
    showSaveOverlay('Adding category...');
    try {
        const res = await API.request('/categories', 'POST', { name: name.trim() }, true);
        if (res.data) {
            const select = document.getElementById('swal-category') || document.getElementById('swal-skill-category') || document.getElementById('swal-cert-category');
            if (select) {
                const opt = document.createElement('option');
                opt.value = res.data.id;
                opt.textContent = res.data.name;
                opt.selected = true;
                select.appendChild(opt);
            }
        }
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    } finally {
        hideSaveOverlay();
    }
};

window.showProjectModal = async (project = null) => {
    const isEdit = project !== null;
    const imgHtml = (isEdit && project.image_url)
        ? `<img src="${project.image_url}" class="mt-2 rounded w-100" style="height:100px;object-fit:cover;">`
        : '';

    // Fetch categories for dropdown
    let categoryOptions = '<option value="">-- No category --</option>';
    try {
        const catRes = await API.getCategories();
        const cats = catRes.data || [];
        cats.forEach(c => {
            const selected = (isEdit && project.category_id === c.id) ? 'selected' : '';
            categoryOptions += `<option value="${c.id}" ${selected}>${c.name}</option>`;
        });
    } catch (e) {
        categoryOptions = '<option value="">-- Could not load categories --</option>';
    }

    Swal.fire({
        title: isEdit ? 'Edit Project' : 'Add New Project',
        width: '620px',
        html: `
            <div style="text-align:left">
                <div class="mb-2">
                    <label class="form-label fw-bold">Title *</label>
                    <input id="swal-title" class="form-control" placeholder="Project title" value="${isEdit ? (project.title || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Description *</label>
                    <textarea id="swal-desc" class="form-control" rows="3" placeholder="Project description">${isEdit ? (project.description || '') : ''}</textarea>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Category</label>
                    <div class="d-flex gap-2">
                        <select id="swal-category" class="form-select">${categoryOptions}</select>
                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addNewCategory()">+ New</button>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Live URL</label>
                    <input id="swal-link" class="form-control" placeholder="https://myproject.com" value="${isEdit ? (project.live_link || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">GitHub URL</label>
                    <input id="swal-github" class="form-control" placeholder="https://github.com/user/repo" value="${isEdit ? (project.github_link || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Status</label>
                    <select id="swal-active" class="form-select">
                        <option value="1" ${(isEdit && project.is_active) ? 'selected' : ''}>🟢 Live / Active</option>
                        <option value="0" ${(isEdit && !project.is_active) ? 'selected' : ''}>⚫ Offline / Inactive</option>
                    </select>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Image ${isEdit ? '(leave empty to keep current)' : '*'}</label>
                    ${imgHtml}
                    <input type="file" id="swal-img" class="form-control mt-1" accept="image/*">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isEdit ? 'Save Changes' : 'Add Project',
        confirmButtonColor: '#0d6efd',
        focusConfirm: false,
        preConfirm: () => {
            const title = document.getElementById('swal-title').value.trim();
            const desc = document.getElementById('swal-desc').value.trim();
            const imgFile = document.getElementById('swal-img').files[0];
            if (!title) { Swal.showValidationMessage('Title is required!'); return false; }
            if (!desc) { Swal.showValidationMessage('Description is required!'); return false; }
            if (!isEdit && !imgFile) { Swal.showValidationMessage('Please select an image!'); return false; }
            return {
                title,
                description: desc,
                category_id: document.getElementById('swal-category').value,
                live_link: document.getElementById('swal-link').value.trim(),
                github_link: document.getElementById('swal-github').value.trim(),
                is_active: document.getElementById('swal-active').value,
                image: imgFile
            };
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        const v = result.value;
        const formData = new FormData();
        formData.append('title', v.title);
        formData.append('description', v.description);
        if (v.category_id) formData.append('category_id', v.category_id);
        if (v.live_link) formData.append('live_link', v.live_link);
        if (v.github_link) formData.append('github_link', v.github_link);
        formData.append('is_active', v.is_active);
        if (v.image) formData.append('image', v.image);

        showSaveOverlay('Saving project...');
        try {
            if (isEdit) {
                formData.append('_method', 'PUT');
                await API.request('/projects/' + project.id, 'POST', formData, true);
                Swal.fire('Updated!', 'Project updated successfully.', 'success');
            } else {
                await API.request('/projects', 'POST', formData, true);
                Swal.fire('Added!', 'Project added successfully.', 'success');
            }
            loadPage('projects');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            hideSaveOverlay();
        }
    });
};

window.deleteProject = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Project?',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete'
    });
    if (!result.isConfirmed) return;
    showSaveOverlay('Deleting project...');
    try {
        await API.request('/projects/' + id, 'DELETE', null, true);
        Swal.fire('Deleted!', '', 'success');
        loadPage('projects');
    } catch (e) {
        Swal.fire('Error', e.message, 'error');
    } finally {
        hideSaveOverlay();
    }
};

// =============================================
// --- Skills ---
// =============================================
async function renderSkills(container) {
    const response = await API.getSkills();
    const skills = response.data || [];

    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-4';
    const h2 = document.createElement('h2');
    h2.className = 'mb-0';
    h2.textContent = 'Skills';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '+ Add New Skill';
    addBtn.onclick = () => showSkillModal();
    header.appendChild(h2);
    header.appendChild(addBtn);
    container.appendChild(header);

    if (skills.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'alert alert-info';
        empty.textContent = 'No skills added yet. Add your first skill!';
        container.appendChild(empty);
        return;
    }

    // Group skills by category
    const groups = {};
    skills.forEach(s => {
        const catName = (s.category && s.category.name) ? s.category.name : 'General';
        const catId = (s.category && s.category.id) ? s.category.id : 0;
        if (!groups[catName]) groups[catName] = { id: catId, skills: [] };
        groups[catName].skills.push(s);
    });

    const row = document.createElement('div');
    row.className = 'row g-4';

    Object.entries(groups).forEach(([catName, group]) => {
        const col = document.createElement('div');
        col.className = 'col-md-6';

        const card = document.createElement('div');
        card.className = 'card shadow-sm h-100';

        // Card header with category name
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
        const catTitle = document.createElement('h5');
        catTitle.className = 'mb-0 fw-bold';
        catTitle.textContent = catName;
        cardHeader.appendChild(catTitle);
        card.appendChild(cardHeader);

        // Card body with skill list
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body p-0';

        const list = document.createElement('ul');
        list.className = 'list-group list-group-flush';

        group.skills.forEach(s => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';

            // Left: checkmark + name
            const leftDiv = document.createElement('div');
            leftDiv.className = 'd-flex align-items-center gap-2';
            const check = document.createElement('span');
            check.textContent = '✅';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'fw-medium';
            nameSpan.textContent = s.name;
            leftDiv.appendChild(check);
            leftDiv.appendChild(nameSpan);

            // Right: sort badge + actions
            const rightDiv = document.createElement('div');
            rightDiv.className = 'd-flex align-items-center gap-2';

            const sortBadge = document.createElement('span');
            sortBadge.className = 'badge bg-light text-dark border';
            sortBadge.textContent = '#' + s.sort_order;
            sortBadge.title = 'Sort order';

            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-outline-primary';
            editBtn.textContent = '✏️';
            editBtn.onclick = () => showSkillModal(s);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.textContent = '🗑️';
            deleteBtn.onclick = () => deleteSkill(s.id);

            rightDiv.appendChild(sortBadge);
            rightDiv.appendChild(editBtn);
            rightDiv.appendChild(deleteBtn);

            li.appendChild(leftDiv);
            li.appendChild(rightDiv);
            list.appendChild(li);
        });

        cardBody.appendChild(list);
        card.appendChild(cardBody);
        col.appendChild(card);
        row.appendChild(col);
    });

    container.appendChild(row);
}
// Global helper: create category from skill modal
window.addNewSkillCategory = async () => {
    const name = prompt('New category name (e.g. Frontend Developer):');
    if (!name || !name.trim()) return;
    try {
        const res = await API.request('/categories', 'POST', { name: name.trim() }, true);
        if (res.data) {
            const select = document.getElementById('swal-skill-category');
            const opt = document.createElement('option');
            opt.value = res.data.id;
            opt.textContent = res.data.name;
            opt.selected = true;
            select.appendChild(opt);
        }
    } catch (e) {
        alert('Failed to create category: ' + e.message);
    }
};

window.showSkillModal = async (skill = null) => {
    const isEdit = skill !== null;

    // Fetch categories for dropdown
    let categoryOptions = '<option value="">-- General (no category) --</option>';
    try {
        const catRes = await API.getCategories();
        const cats = catRes.data || [];
        cats.forEach(c => {
            const selected = (isEdit && skill.category_id === c.id) ? 'selected' : '';
            categoryOptions += `<option value="${c.id}" ${selected}>${c.name}</option>`;
        });
    } catch (e) { }

    Swal.fire({
        title: isEdit ? 'Edit Skill' : 'Add New Skill',
        width: '520px',
        html: `
            <div style="text-align:left">
                <div class="mb-2">
                    <label class="form-label fw-bold">Skill Name *</label>
                    <input id="swal-skill-name" class="form-control" placeholder="e.g. Laravel, React, MySQL" value="${isEdit ? (skill.name || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Category</label>
                    <div class="d-flex gap-2">
                        <select id="swal-skill-category" class="form-select">${categoryOptions}</select>
                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addNewSkillCategory()">+ New</button>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Sort Order <small class="text-muted">(lower = first)</small></label>
                    <input type="number" id="swal-skill-order" class="form-control" placeholder="0" min="0" value="${isEdit ? (skill.sort_order ?? 0) : 0}">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isEdit ? 'Save Changes' : 'Add Skill',
        confirmButtonColor: '#0d6efd',
        focusConfirm: false,
        preConfirm: () => {
            const name = document.getElementById('swal-skill-name').value.trim();
            if (!name) { Swal.showValidationMessage('Skill name is required!'); return false; }
            return {
                name,
                category_id: document.getElementById('swal-skill-category').value,
                sort_order: document.getElementById('swal-skill-order').value || 0,
                proficiency: 100
            };
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        const v = result.value;
        const payload = {
            name: v.name,
            proficiency: v.proficiency,
            sort_order: parseInt(v.sort_order) || 0
        };
        if (v.category_id) payload.category_id = v.category_id;

        showSaveOverlay('Saving skill...');
        try {
            if (isEdit) {
                await API.request('/skills/' + skill.id, 'PUT', payload, true);
                Swal.fire('Updated!', '', 'success');
            } else {
                await API.request('/skills', 'POST', payload, true);
                Swal.fire('Added!', '', 'success');
            }
            loadPage('skills');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            hideSaveOverlay();
        }
    });
};

window.deleteSkill = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Skill?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete'
    });
    if (!result.isConfirmed) return;
    try {
        await API.request('/skills/' + id, 'DELETE', null, true);
        loadPage('skills');
        Swal.fire('Deleted!', '', 'success');
    } catch (e) { Swal.fire('Error', e.message, 'error'); }
};

// =============================================
// --- Certificates ---
// =============================================
async function renderCertificates(container) {
    const response = await API.getCertificates();
    const certs = response.data || [];

    container.innerHTML = '';

    // ---- Page Header ----
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center mb-4';
    const h2 = document.createElement('h2');
    h2.className = 'mb-0';
    h2.textContent = 'Certificates';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary';
    addBtn.textContent = '+ Add Certificate';
    addBtn.onclick = () => showCertModal();
    header.appendChild(h2);
    header.appendChild(addBtn);
    container.appendChild(header);

    // ---- Split certificates by category ----
    // Category 1 = Web / Programming, Category 2 = Cyber Security / Networking
    const WEB_CAT_ID   = 1;
    const NET_CAT_ID   = 2;

    function isWebCert(c) {
        if (c.category_id === WEB_CAT_ID) return true;
        const name = (c.category && c.category.name ? c.category.name : '').toLowerCase();
        return name.includes('web') || name.includes('program') || name.includes('develop');
    }
    function isNetCert(c) {
        if (c.category_id === NET_CAT_ID) return true;
        const name = (c.category && c.category.name ? c.category.name : '').toLowerCase();
        return name.includes('cyber') || name.includes('network') || name.includes('security');
    }

    const webCerts  = certs.filter(c => isWebCert(c));
    const netCerts  = certs.filter(c => isNetCert(c) && !isWebCert(c));
    // Any cert that matched neither tab goes into Web by default
    const otherCerts = certs.filter(c => !isWebCert(c) && !isNetCert(c));
    const webAll = [...webCerts, ...otherCerts];

    // ---- Bootstrap Tabs ----
    const tabsWrapper = document.createElement('div');
    tabsWrapper.innerHTML = `
        <ul class="nav nav-tabs mb-4" id="certTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="tab-web" data-bs-toggle="tab"
                        data-bs-target="#pane-web" type="button" role="tab"
                        aria-controls="pane-web" aria-selected="true">
                    💻 Programming <span class="badge bg-primary ms-1">${webAll.length}</span>
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="tab-net" data-bs-toggle="tab"
                        data-bs-target="#pane-net" type="button" role="tab"
                        aria-controls="pane-net" aria-selected="false">
                    🔒 Networking &amp; Security <span class="badge bg-danger ms-1">${netCerts.length}</span>
                </button>
            </li>
        </ul>
        <div class="tab-content" id="certTabContent">
            <div class="tab-pane fade show active" id="pane-web" role="tabpanel" aria-labelledby="tab-web">
                <div class="row g-4" id="cert-row-web"></div>
            </div>
            <div class="tab-pane fade" id="pane-net" role="tabpanel" aria-labelledby="tab-net">
                <div class="row g-4" id="cert-row-net"></div>
            </div>
        </div>`;
    container.appendChild(tabsWrapper);

    // ---- Helper: build one certificate card ----
    function buildCertCard(c) {
        const imgSrc  = c.image_url || 'https://via.placeholder.com/400x200?text=Certificate';
        const catName = (c.category && c.category.name) ? c.category.name : 'General';

        const col  = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = 'card h-100 shadow-sm';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = 'card-img-top';
        img.style.cssText = 'height:160px;object-fit:cover;';
        img.onerror = () => { img.src = 'https://via.placeholder.com/400x160?text=No+Preview'; };
        card.appendChild(img);

        const body = document.createElement('div');
        body.className = 'card-body d-flex flex-column';

        const catBadge = document.createElement('span');
        catBadge.className = 'badge bg-secondary mb-2 align-self-start';
        catBadge.textContent = catName;
        body.appendChild(catBadge);

        const titleEl = document.createElement('h5');
        titleEl.className = 'card-title fw-bold mb-1';
        titleEl.textContent = c.title;
        body.appendChild(titleEl);

        const issuerEl = document.createElement('p');
        issuerEl.className = 'card-text text-muted small mb-1';
        issuerEl.innerHTML = `🏛️ ${c.issuer || '—'}`;
        body.appendChild(issuerEl);

        if (c.date_acquired) {
            const dateEl = document.createElement('p');
            dateEl.className = 'card-text text-muted small mb-2';
            dateEl.innerHTML = `📅 ${c.date_acquired}`;
            body.appendChild(dateEl);
        }

        if (c.file_url) {
            const pdfLink = document.createElement('a');
            pdfLink.href = c.file_url;
            pdfLink.target = '_blank';
            pdfLink.className = 'btn btn-sm btn-outline-primary mb-2';
            pdfLink.innerHTML = '📄 View Certificate';
            body.appendChild(pdfLink);
        }

        const actions = document.createElement('div');
        actions.className = 'd-flex gap-2 mt-auto';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline-secondary flex-fill';
        editBtn.textContent = '✏️ Edit';
        editBtn.onclick = () => showCertModal(c);

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-sm btn-outline-danger flex-fill';
        delBtn.textContent = '🗑️ Delete';
        delBtn.onclick = () => deleteCertificate(c.id);

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        body.appendChild(actions);

        card.appendChild(body);
        col.appendChild(card);
        return col;
    }

    // ---- Populate Web tab ----
    const webRow = document.getElementById('cert-row-web');
    if (webAll.length === 0) {
        webRow.innerHTML = '<div class="col-12"><div class="alert alert-info">No programming certificates added yet.</div></div>';
    } else {
        webAll.forEach(c => webRow.appendChild(buildCertCard(c)));
    }

    // ---- Populate Network tab ----
    const netRow = document.getElementById('cert-row-net');
    if (netCerts.length === 0) {
        netRow.innerHTML = '<div class="col-12"><div class="alert alert-info">No networking / security certificates added yet.</div></div>';
    } else {
        netCerts.forEach(c => netRow.appendChild(buildCertCard(c)));
    }
}

// Helper: create a category from within the certificate modal
window.addNewCertCategory = async () => {
    const name = prompt('New category name:');
    if (!name || !name.trim()) return;
    try {
        const res = await API.request('/categories', 'POST', { name: name.trim() }, true);
        if (res.data) {
            const select = document.getElementById('swal-cert-category');
            const opt = document.createElement('option');
            opt.value = res.data.id;
            opt.textContent = res.data.name;
            opt.selected = true;
            select.appendChild(opt);
        }
    } catch (e) { alert('Failed: ' + e.message); }
};

window.showCertModal = async (cert = null) => {
    const isEdit = cert !== null;

    // Load categories
    let catOptions = '<option value="">-- General (no category) --</option>';
    try {
        const catRes = await API.getCategories();
        (catRes.data || []).forEach(c => {
            const sel = (isEdit && cert.category_id === c.id) ? 'selected' : '';
            catOptions += `<option value="${c.id}" ${sel}>${c.name}</option>`;
        });
    } catch (e) { }

    const currentImg = (isEdit && cert.image_url)
        ? `<img src="${cert.image_url}" class="img-thumbnail mt-1" style="height:80px;object-fit:cover;">`
        : '';
    const currentPdf = (isEdit && cert.file_url)
        ? `<a href="${cert.file_url}" target="_blank" class="btn btn-sm btn-outline-primary mt-1">📄 Current File</a>`
        : '';

    Swal.fire({
        title: isEdit ? 'Edit Certificate' : 'Add Certificate',
        width: '640px',
        html: `
            <div style="text-align:left">
                <div class="mb-2">
                    <label class="form-label fw-bold">Certificate Title *</label>
                    <input id="swal-cert-title" class="form-control" placeholder="e.g. AWS Cloud Practitioner" value="${isEdit ? (cert.title || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Issuing Organization *</label>
                    <input id="swal-cert-issuer" class="form-control" placeholder="e.g. Amazon, Udemy, Coursera" value="${isEdit ? (cert.issuer || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Category</label>
                    <div class="d-flex gap-2">
                        <select id="swal-cert-category" class="form-select">${catOptions}</select>
                        <button type="button" class="btn btn-outline-secondary btn-sm" onclick="addNewCertCategory()">+ New</button>
                    </div>
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Date Acquired</label>
                    <input type="date" id="swal-cert-date" class="form-control" value="${isEdit ? (cert.date_acquired || '') : ''}">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Certificate File (PDF or Image) ${isEdit ? '<small class="text-muted">— leave empty to keep current</small>' : '*'}</label>
                    ${currentPdf}
                    <input type="file" id="swal-cert-file" class="form-control mt-1" accept=".pdf,image/*">
                </div>
                <div class="mb-2">
                    <label class="form-label fw-bold">Preview Image ${isEdit ? '<small class="text-muted">— leave empty to keep current</small>' : '(optional)'}</label>
                    ${currentImg}
                    <input type="file" id="swal-cert-img" class="form-control mt-1" accept="image/*">
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: isEdit ? 'Save Changes' : 'Add Certificate',
        confirmButtonColor: '#0d6efd',
        focusConfirm: false,
        preConfirm: () => {
            const title = document.getElementById('swal-cert-title').value.trim();
            const issuer = document.getElementById('swal-cert-issuer').value.trim();
            const file = document.getElementById('swal-cert-file').files[0];
            if (!title) { Swal.showValidationMessage('Title is required!'); return false; }
            if (!issuer) { Swal.showValidationMessage('Issuing organization is required!'); return false; }
            if (!isEdit && !file) { Swal.showValidationMessage('Certificate file is required!'); return false; }
            return {
                title,
                issuer,
                category_id: document.getElementById('swal-cert-category').value,
                date_acquired: document.getElementById('swal-cert-date').value,
                cert_file: file,
                image: document.getElementById('swal-cert-img').files[0]
            };
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;
        const v = result.value;

        const formData = new FormData();
        formData.append('title', v.title);
        formData.append('issuer', v.issuer);
        if (v.category_id) formData.append('category_id', v.category_id);
        if (v.date_acquired) formData.append('date_acquired', v.date_acquired);
        if (v.cert_file) formData.append('certificate_file', v.cert_file);
        if (v.image) formData.append('image', v.image);

        showSaveOverlay('Saving certificate...');
        try {
            if (isEdit) {
                formData.append('_method', 'PUT');
                await API.request('/certificates/' + cert.id, 'POST', formData, true);
                Swal.fire('Updated!', 'Certificate updated.', 'success');
            } else {
                await API.request('/certificates', 'POST', formData, true);
                Swal.fire('Added!', 'Certificate added.', 'success');
            }
            loadPage('certificates');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            hideSaveOverlay();
        }
    });
};

window.deleteCertificate = async (id) => {
    const result = await Swal.fire({
        title: 'Delete Certificate?',
        text: 'This cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, Delete'
    });
    if (!result.isConfirmed) return;
    showSaveOverlay('Deleting certificate...');
    try {
        await API.request('/certificates/' + id, 'DELETE', null, true);
        loadPage('certificates');
        Swal.fire('Deleted!', '', 'success');
    } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { hideSaveOverlay(); }
};

// =============================================
// --- Profile ---
// =============================================
async function renderProfile(container) {
    const response = await API.getPersonalInfo();
    const info = response.data || {};
    const socialsResponse = await API.getSocialLinks();
    const socials = socialsResponse.data || [];

    let projectCount = info.completed_projects || 0;
    try {
        const projRes = await API.getProjects();
        const projects = projRes.data || [];
        projectCount = projects.length;
    } catch (e) { }

    let mainThemeColor = '#06b6d4';
    let bgThemeColor = '#031B28';
    if (info.theme_color) {
        if (info.theme_color.includes(',')) {
            const parts = info.theme_color.split(',');
            mainThemeColor = parts[0];
            bgThemeColor = parts[1];
        } else {
            mainThemeColor = info.theme_color;
        }
    }

    container.innerHTML = '';

    const appUrl = typeof IMG_BASE_URL !== 'undefined' ? IMG_BASE_URL : '';
    const profileImgSrc = info.profile_image
        ? (info.profile_image.startsWith('http') ? info.profile_image : appUrl + '/' + info.profile_image)
        : null;
    const cvWebUrl = info.cv_web_url
        ? (info.cv_web_url.startsWith('http') ? info.cv_web_url : appUrl + '/' + info.cv_web_url)
        : null;
    const cvNetworkUrl = info.cv_network_url
        ? (info.cv_network_url.startsWith('http') ? info.cv_network_url : appUrl + '/' + info.cv_network_url)
        : null;

    const h2 = document.createElement('h2');
    h2.textContent = 'Personal Info';
    h2.className = 'mb-4';
    container.appendChild(h2);

    const form = document.createElement('form');
    form.id = 'profileForm';
    form.className = 'mb-5';
    form.enctype = 'multipart/form-data';
    form.innerHTML = `
        <div class="row g-3">

            <!-- Profile Photo -->
            <div class="col-12">
                <label class="form-label fw-bold">Profile Photo</label><br>
                ${profileImgSrc ? `<img src="${profileImgSrc}" class="rounded-circle mb-2" style="width:80px;height:80px;object-fit:cover;" onerror="this.style.display='none'">` : ''}
                <input type="file" class="form-control" name="profile_image" accept="image/*">
            </div>

            <!-- Name & Job Title -->
            <div class="col-md-6">
                <label class="form-label fw-bold">Full Name</label>
                <input type="text" class="form-control" name="full_name" value="${info.full_name || ''}" placeholder="Your full name">
            </div>
            <div class="col-md-6">
                <label class="form-label fw-bold">Job Title</label>
                <input type="text" class="form-control" name="job_title" value="${info.job_title || ''}" placeholder="e.g. Full Stack Developer">
            </div>

            <!-- Bio -->
            <div class="col-12">
                <label class="form-label fw-bold">Bio / Description</label>
                <textarea class="form-control" name="bio" rows="4" placeholder="Brief description about yourself">${info.bio || ''}</textarea>
            </div>

            <!-- Phone (WhatsApp) & Email -->
            <div class="col-md-6">
                <label class="form-label fw-bold">📱 WhatsApp / Phone</label>
                <input type="text" class="form-control" name="phone" value="${info.phone || ''}" placeholder="+201234567890">
            </div>
            <div class="col-md-6">
                <label class="form-label fw-bold">📧 Email</label>
                <input type="email" class="form-control" name="email" value="${info.email || ''}" placeholder="you@example.com">
            </div>

            <!-- CV Uploads -->
            <div class="col-12"><hr><h5 class="fw-bold mb-1">📄 CV Files</h5></div>

            <div class="col-md-6">
                <label class="form-label fw-bold">💻 Web Development CV (PDF)</label>
                ${cvWebUrl ? `<div class="mb-1"><a href="${cvWebUrl}" target="_blank" class="btn btn-sm btn-outline-success">📥 View Current Web CV</a></div>` : '<p class="text-muted small mb-1">No file uploaded yet.</p>'}
                <input type="file" class="form-control" id="cv_web_file" name="cv_web_file" accept=".pdf">
                <small class="text-muted">Upload a new PDF to replace the Web Dev CV</small>
                <label class="form-label fw-bold mt-2">🏷️ Web CV Button Text</label>
                <input type="text" class="form-control" id="cv_web_btn_text" name="cv_web_btn_text"
                       value="${info.cv_web_btn_text || ''}" placeholder="e.g. Download Web CV">
                <small class="text-muted">Label shown on the portfolio download button</small>
            </div>

            <div class="col-md-6">
                <label class="form-label fw-bold">🔒 Networking &amp; Security CV (PDF)</label>
                ${cvNetworkUrl ? `<div class="mb-1"><a href="${cvNetworkUrl}" target="_blank" class="btn btn-sm btn-outline-info">📥 View Current Network CV</a></div>` : '<p class="text-muted small mb-1">No file uploaded yet.</p>'}
                <input type="file" class="form-control" id="cv_network_file" name="cv_network_file" accept=".pdf">
                <small class="text-muted">Upload a new PDF to replace the Networking CV</small>
                <label class="form-label fw-bold mt-2">🏷️ Network CV Button Text</label>
                <input type="text" class="form-control" id="cv_network_btn_text" name="cv_network_btn_text"
                       value="${info.cv_network_btn_text || ''}" placeholder="e.g. Download Network CV">
                <small class="text-muted">Label shown on the portfolio download button</small>
            </div>

            <!-- 🎨 Theme Color -->
            <div class="col-12"><hr><h5 class="fw-bold mb-1">🎨 Portfolio Accent Color</h5>
                <small class="text-muted d-block mb-3">Changes the glow color, buttons, progress bars and borders across the entire portfolio</small>
            </div>
            <div class="col-12">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <input type="color" class="form-control form-control-color" name="theme_color_main" 
                           value="${mainThemeColor}" id="themeColorPicker"
                           title="Pick accent color" style="height:54px; width:80px; cursor:pointer;">
                    <div class="d-flex gap-2 flex-wrap" id="colorPresets">
                        <button type="button" class="color-swatch" data-color="#06b6d4" style="background:#06b6d4;" title="Cyan (Default)"></button>
                        <button type="button" class="color-swatch" data-color="#a78bfa" style="background:#a78bfa;" title="Purple"></button>
                        <button type="button" class="color-swatch" data-color="#34d399" style="background:#34d399;" title="Emerald"></button>
                        <button type="button" class="color-swatch" data-color="#fb7185" style="background:#fb7185;" title="Rose"></button>
                        <button type="button" class="color-swatch" data-color="#fbbf24" style="background:#fbbf24;" title="Amber"></button>
                        <button type="button" class="color-swatch" data-color="#60a5fa" style="background:#60a5fa;" title="Blue"></button>
                        <button type="button" class="color-swatch" data-color="#f97316" style="background:#f97316;" title="Orange"></button>
                        <button type="button" class="color-swatch" data-color="#e879f9" style="background:#e879f9;" title="Pink"></button>
                    </div>
                    <div id="colorPreview" style="
                        width:200px; height:54px; border-radius:12px; display:flex; align-items:center;
                        justify-content:center; font-weight:700; font-size:0.85rem; border:2px solid;
                        background: rgba(6,182,212,0.15); color:#06b6d4; border-color:#06b6d4;
                        transition: all 0.3s ease;
                    ">
                        ✦ Preview Color
                    </div>
                </div>
            </div>

            <!-- 🖤 Background Mesh Color -->
            <div class="col-12"><hr><h5 class="fw-bold mb-1">🖤 Background Mesh Color</h5>
                <small class="text-muted d-block mb-3">Changes the secondary color mixed with black in the animated background</small>
            </div>
            <div class="col-12">
                <div class="d-flex align-items-center gap-3 flex-wrap">
                    <input type="color" class="form-control form-control-color" name="theme_color_bg" 
                           value="${bgThemeColor}" id="themeBgColorPicker"
                           title="Pick background color" style="height:54px; width:80px; cursor:pointer;">
                    
                    <div id="bgColorPreview" style="
                        width:200px; height:54px; border-radius:12px; display:flex; align-items:center;
                        justify-content:center; font-weight:700; font-size:0.85rem; border:2px solid;
                        background: ${bgThemeColor}; color:#fff; border-color:#000;
                        transition: all 0.3s ease;
                    ">
                        ✦ Background Color
                    </div>
                </div>
                <style>
                    .color-swatch { width:36px; height:36px; border-radius:50%; border:3px solid transparent; cursor:pointer; transition:all 0.2s; }
                    .color-swatch:hover { transform:scale(1.2); border-color:rgba(255,255,255,0.5); }
                    .color-swatch.active { border-color:#fff; transform:scale(1.15); box-shadow:0 0 12px currentColor; }
                </style>
            </div>

            <!-- Stats -->
            <div class="col-12"><hr><h5 class="fw-bold mb-3">📊 Stats (shown on portfolio)</h5></div>

            <div class="col-md-4">
                <label class="form-label fw-bold">⏳ Years of Experience</label>
                <input type="number" class="form-control" name="years_experience" value="${info.years_experience || 0}" min="0">
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">✅ Completed Projects</label>
                <input type="number" class="form-control" name="completed_projects" value="${projectCount}" min="0">
                <small class="text-muted">Auto-counted: ${projectCount} (editable)</small>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">😊 Satisfied Clients</label>
                <input type="number" class="form-control" name="satisfied_customers" value="${info.satisfied_customers || 0}" min="0">
            </div>

        </div>
        <button type="submit" class="btn btn-success mt-4">💾 Update Info</button>`;
    container.appendChild(form);

    // --- Color picker live preview logic ---
    const picker = document.getElementById('themeColorPicker');
    const preview = document.getElementById('colorPreview');
    const swatches = document.querySelectorAll('.color-swatch');

    function updatePreview(hex) {
        preview.style.background = hex + '22';
        preview.style.color = hex;
        preview.style.borderColor = hex;
        picker.value = hex;
        swatches.forEach(s => s.classList.toggle('active', s.dataset.color === hex));
    }
    // Set initial active swatch
    updatePreview(mainThemeColor);

    picker.addEventListener('input', () => updatePreview(picker.value));
    swatches.forEach(s => {
        s.addEventListener('click', () => updatePreview(s.dataset.color));
    });

    const bgPicker = document.getElementById('themeBgColorPicker');
    const bgPreview = document.getElementById('bgColorPreview');
    bgPicker.addEventListener('input', () => {
        bgPreview.style.background = bgPicker.value;
    });

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        const formData = new FormData(e.target);
        
        const mainColor = formData.get('theme_color_main') || '#06b6d4';
        const bgColor = formData.get('theme_color_bg') || '#031B28';
        formData.set('theme_color', `${mainColor},${bgColor}`);
        formData.delete('theme_color_main');
        formData.delete('theme_color_bg');
        
        await wrapSubmit(btn, async () => {
            try {
                await API.request('/personal-info', 'POST', formData, true);
                Swal.fire('Success', 'Profile updated!', 'success');
                loadPage('profile'); // reload to show new image/CV
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
            }
        });
    });

    const hr = document.createElement('hr');
    container.appendChild(hr);

    const socialsHeader = document.createElement('div');
    socialsHeader.className = 'd-flex justify-content-between align-items-center mb-3';
    const h3 = document.createElement('h3');
    h3.textContent = 'Social Links';
    const addSocialBtn = document.createElement('button');
    addSocialBtn.className = 'btn btn-primary btn-sm';
    addSocialBtn.textContent = '+ Add Link';
    addSocialBtn.onclick = () => showSocialModal();
    socialsHeader.appendChild(h3);
    socialsHeader.appendChild(addSocialBtn);
    container.appendChild(socialsHeader);

    const ul = document.createElement('ul');
    ul.className = 'list-group';

    if (socials.length === 0) {
        ul.innerHTML = '<li class="list-group-item text-muted">No social links added yet.</li>';
    } else {
        socials.forEach(s => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';

            const info_div = document.createElement('div');
            info_div.innerHTML = '<strong>' + s.platform + '</strong>: <a href="' + s.url + '" target="_blank">' + s.url + '</a>';

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-sm btn-outline-danger';
            delBtn.textContent = 'Delete';
            delBtn.onclick = () => deleteSocial(s.id);

            li.appendChild(info_div);
            li.appendChild(delBtn);
            ul.appendChild(li);
        });
    }

    container.appendChild(ul);
}

window.showSocialModal = () => {
    Swal.fire({
        title: 'Add Social Link',
        html: `
            <select id="swal-platform" class="swal2-input">
                <option value="linkedin">LinkedIn</option>
                <option value="github">GitHub</option>
                <option value="twitter">Twitter</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="other">Other</option>
            </select>
            <input id="swal-url" class="swal2-input" placeholder="URL">
        `,
        preConfirm: () => ({
            platform: document.getElementById('swal-platform').value,
            url: document.getElementById('swal-url').value
        })
    }).then(async (result) => {
        if (result.isConfirmed) {
            showSaveOverlay('Saving link...');
            try {
                await API.request('/social-links', 'POST', result.value, true);
                loadPage('profile');
                Swal.fire('Saved!', '', 'success');
            } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { hideSaveOverlay(); }
        }
    });
};

window.deleteSocial = async (id) => {
    const result = await Swal.fire({ title: 'Delete Social Link?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545' });
    if (!result.isConfirmed) return;
    showSaveOverlay('Deleting link...');
    try {
        await API.request('/social-links/' + id, 'DELETE', null, true);
        loadPage('profile');
        Swal.fire('Deleted!', '', 'success');
    } catch (e) { Swal.fire('Error', e.message, 'error'); } finally { hideSaveOverlay(); }
};
