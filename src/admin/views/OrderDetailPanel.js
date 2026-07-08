import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';

function AdminThreeDPreview({ fileUrl, filename, color }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const colorMap = {
    Black: 0x1f1f22,
    White: 0xf9f9fc,
    Silver: 0xbac0ca,
    Red: 0xdf2222,
    Blue: 0x2262df
  };
  const selectedHex = colorMap[color] || 0x1f1f22;

  useEffect(() => {
    if (!containerRef.current || !fileUrl) return;

    setLoading(true);
    setError(false);

    let scene, camera, renderer, controls, animationFrameId;
    let modelMesh = null;

    const width = containerRef.current.clientWidth || 300;
    const height = 220;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);

    // Camera
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 5000);
    camera.position.set(30, 30, 45);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight1.position.set(40, 80, 40);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dirLight2.position.set(-40, -20, -40);
    scene.add(dirLight2);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x10b981, 0xcbd5e1);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // Model Group container to act as a pivot point for centered rotation
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (modelMesh) {
        modelMesh.rotation.y += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
    };

    // Helper to center camera and align grid after geometry loading
    const centerCameraAndGrid = () => {
      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);

      controls.target.copy(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.7; // Buffer space
      
      gridHelper.position.y = box.min.y - 0.1;

      camera.position.set(center.x + cameraZ * 0.4, center.y + cameraZ * 0.5, center.z + cameraZ * 1.1);
      camera.lookAt(center);
      controls.update();
    };

    const fileLower = (filename || '').toLowerCase();
    const handleGeometry = (geom) => {
      geom.center();
      const material = new THREE.MeshStandardMaterial({
        color: selectedHex,
        roughness: 0.4,
        metalness: 0.2
      });
      const mesh = new THREE.Mesh(geom, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      geom.computeBoundingBox();
      const size = new THREE.Vector3();
      geom.boundingBox.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 20;
      if (maxDim > 0) {
        const scale = targetSize / maxDim;
        mesh.scale.set(scale, scale, scale);
      }

      modelGroup.add(mesh);
      modelMesh = modelGroup;

      centerCameraAndGrid();
      setLoading(false);
      animate();
    };

    const handleObjectGroup = (obj) => {
      obj.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: selectedHex,
            roughness: 0.4,
            metalness: 0.2
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // 1. Scale first
      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 20;
      if (maxDim > 0) {
        const scale = targetSize / maxDim;
        obj.scale.set(scale, scale, scale);
      }

      obj.updateMatrixWorld(true);

      // 2. Center next
      const boxScaled = new THREE.Box3().setFromObject(obj);
      const center = new THREE.Vector3();
      boxScaled.getCenter(center);
      obj.position.sub(center);

      modelGroup.add(obj);
      modelMesh = modelGroup;

      centerCameraAndGrid();
      setLoading(false);
      animate();
    };

    if (fileLower.endsWith('.stl')) {
      const loader = new STLLoader();
      loader.load(fileUrl, handleGeometry, undefined, (err) => {
        console.error('Failed to load STL:', err);
        setError(true);
        setLoading(false);
      });
    } else if (fileLower.endsWith('.obj')) {
      const loader = new OBJLoader();
      loader.load(fileUrl, handleObjectGroup, undefined, (err) => {
        console.error('Failed to load OBJ:', err);
        setError(true);
        setLoading(false);
      });
    } else if (fileLower.endsWith('.3mf')) {
      const loader = new ThreeMFLoader();
      loader.load(fileUrl, handleObjectGroup, undefined, (err) => {
        console.error('Failed to load 3MF:', err);
        setError(true);
        setLoading(false);
      });
    } else {
      setError(true);
      setLoading(false);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (controls) controls.dispose();
      if (renderer) renderer.dispose();
      if (modelGroup) {
        scene.remove(modelGroup);
        modelGroup.traverse((child) => {
          if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else if (child.material) {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [fileUrl, filename, selectedHex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', background: '#f1f5f9', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f1f5f9', zIndex: 2 }}>
          <div className="spinner" style={{ borderColor: 'var(--accent) transparent transparent transparent', width: '20px', height: '20px' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Loading 3D render...</span>
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center', background: '#f1f5f9', zIndex: 2 }}>
          <i className="fa-light fa-sharp fa-circle-exclamation" style={{ fontSize: '20px', color: 'var(--danger)', marginBottom: '6px' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>Preview failed / unsupported file format</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default function OrderDetailPanel({ order, type, onClose, onUpdate, updating }) {
  const [active, setActive] = useState(false);
  const [localStatus, setLocalStatus] = useState('');
  const [localPayment, setLocalPayment] = useState('');
  const [localTracking, setLocalTracking] = useState('');
  const [localPrice, setLocalPrice] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [hoveredItemIdx, setHoveredItemIdx] = useState(null);

  const handleProjectItemClick = () => {
    setSelectedItemDetail({
      product_name: order.project_name,
      is_project: true,
      price: order.price,
      quantity: 1,
      image_url: order.project_image_url,
      custom_responses: order.rental_duration_days ? {
        rental_meta: {
          duration: order.rental_duration_days,
          startDate: order.rental_start_date ? order.rental_start_date.substring(0, 10) : '',
          endDate: order.rental_end_date ? order.rental_end_date.substring(0, 10) : '',
          deposit: order.deposit || 0,
          rentalPrice: order.price
        }
      } : null
    });
  };

  const handlePrintItemClick = () => {
    setSelectedItemDetail({
      product_name: order.filename,
      is_3d: true,
      price: order.price,
      quantity: order.quantity || 1,
      custom_responses: {
        material: order.material,
        color: order.color,
        infill: order.infill_percentage,
        layerHeight: order.layer_height_mm,
        notes: order.notes,
        filename: order.filename,
        fileUrl: order.file_url
      }
    });
  };



  const renderAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'string') {
      try {
        const parsed = JSON.parse(addr);
        return renderAddress(parsed);
      } catch (e) {
        return addr;
      }
    }
    if (typeof addr === 'object') {
      const parts = [
        addr.addressLine || addr.address_line || addr.addressLineInfo,
        addr.city,
        addr.district,
        addr.province
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : JSON.stringify(addr);
    }
    return String(addr);
  };

  // Slide-in animation trigger
  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => setActive(true), 50);
      setLocalStatus(order.status || '');
      setLocalPayment(order.payment_status || '');
      setLocalTracking(order.tracking_code || '');
      setLocalPrice(order.price || '');
      setLocalNotes(order.admin_notes || order.buyer_notes || '');
      return () => clearTimeout(timer);
    } else {
      setActive(false);
    }
  }, [order]);

  if (!order) return null;

  const handleClose = () => {
    setActive(false);
    setTimeout(onClose, 300); // Wait for transition out
  };

  // Auto save trigger function
  const triggerSave = async (statusVal = localStatus, paymentVal = localPayment, trackingVal = localTracking, priceVal = localPrice, notesVal = localNotes) => {
    if (type === 'store') {
      await onUpdate(order.id, {
        status: statusVal,
        payment_status: paymentVal,
        tracking_code: trackingVal
      });
    } else if (type === 'print') {
      await onUpdate(order.id, priceVal, statusVal);
    } else if (type === 'web') {
      await onUpdate(order.id, statusVal, notesVal);
    } else if (type === 'project') {
      await onUpdate(order.id, statusVal);
    }
  };

  const handleStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
    triggerSave(newStatus, localPayment, localTracking, localPrice, localNotes);
  };

  const handlePaymentChange = (newPayment) => {
    setLocalPayment(newPayment);
    triggerSave(localStatus, newPayment, localTracking, localPrice, localNotes);
  };

  const handleInputBlur = () => {
    triggerSave(localStatus, localPayment, localTracking, localPrice, localNotes);
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    triggerSave();
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'pending_review':
      case 'unread':
        return 'badge--warning';
      case 'completed':
      case 'delivered':
      case 'accepted':
      case 'paid':
        return 'badge--success';
      case 'cancelled':
      case 'declined':
      case 'refunded':
        return 'badge--danger';
      default:
        return 'badge--info';
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper to render spec tags for custom response bundles inside storefront orders
  const renderItemCustomResponses = (item) => {
    if (!item.custom_responses) return null;
    let parsed = null;
    try {
      parsed = typeof item.custom_responses === 'string' ? JSON.parse(item.custom_responses) : item.custom_responses;
    } catch (e) {
      return null;
    }
    if (!parsed) return null;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px', fontSize: '10px', color: 'var(--text-3)' }}>
        {parsed.material && <span style={{ background: 'var(--bg-1)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: '2px' }}>Material: {parsed.material}</span>}
        {parsed.color && <span style={{ background: 'var(--bg-1)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: '2px' }}>Color: {parsed.color}</span>}
        {parsed.infill && <span style={{ background: 'var(--bg-1)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: '2px' }}>Infill: {parsed.infill}%</span>}
        {parsed.layerHeight && <span style={{ background: 'var(--bg-1)', padding: '2px 6px', border: '1px solid var(--border-strong)', borderRadius: '2px' }}>Layer: {parsed.layerHeight}mm</span>}
        {parsed.rental_meta && (
          <span style={{ background: 'rgba(212, 160, 23, 0.1)', padding: '2px 6px', border: '1px solid var(--accent)', borderRadius: '2px', color: 'var(--accent)' }}>
            Rental: {parsed.rental_meta.duration} Days ({parsed.rental_meta.startDate} to {parsed.rental_meta.endDate})
          </span>
        )}
      </div>
    );
  };

  // Get order category human label
  const getOrderTypeLabel = () => {
    if (type === 'store') return 'Product Store Purchase';
    if (type === 'print') return '3D Printing Service';
    if (type === 'web') return 'Web Agency Project Request';
    if (type === 'project') {
      return order.order_type === 'rent' ? 'Project Rental (Lease)' : 'Project Outright Purchase';
    }
    return 'Direct Order';
  };

  // Resolve Customer details mapping
  const customerName = order.user_name || order.buyer_name || order.name || 'Guest User';
  const customerEmail = order.user_email || order.buyer_email || order.email || 'N/A';
  const customerPhone = order.user_phone || order.buyer_phone || order.phone || 'N/A';
  const customerAvatar = order.user_avatar_url || null;
  const userId = order.user_id || null;

  // Resolve Shipping location details and map coordinates
  let addressString = 'N/A';
  let lat = null;
  let lng = null;

  if (type === 'store') {
    addressString = renderAddress(order.shipping_address);
    if (order.shipping_address && typeof order.shipping_address === 'object') {
      lat = order.shipping_address.lat || null;
      lng = order.shipping_address.lng || null;
    }
  } else if (type === 'print') {
    addressString = order.address_line ? `${order.address_line}, ${order.address_city}, ${order.address_district}, ${order.address_province}` : 'N/A';
    lat = order.address_lat || null;
    lng = order.address_lng || null;
  } else if (type === 'web') {
    addressString = order.address_line ? `${order.address_line}, ${order.address_city}, ${order.address_district}, ${order.address_province}` : 'N/A';
    lat = order.address_lat || null;
    lng = order.address_lng || null;
  } else if (type === 'project') {
    addressString = order.address_line ? `${order.address_line}, ${order.city || ''}, ${order.district || ''}, ${order.province || ''}`.replace(/,\s*,/g, ',').trim() : 'N/A';
    lat = order.lat || null;
    lng = order.lng || null;
  }

  // Costings calculations
  const grossTotal = type === 'web' ? 0 : parseFloat(localPrice || order.total_amount || order.price || 0);
  const taxRate = 0.13; // 13% VAT
  const netAmount = grossTotal / (1 + taxRate);
  const taxAmount = grossTotal - netAmount;

  // Render Status Chips Option selector
  const statusOptions = {
    store: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    print: ['pending_review', 'estimated', 'approved', 'printing', 'completed', 'cancelled'],
    web: ['unread', 'in_discussion', 'proposal_sent', 'accepted', 'declined', 'archived'],
    project: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
  }[type] || [];

  return (
    <div className={`admin-drawer-overlay ${active ? 'active' : ''}`} onClick={handleClose}>
      <div 
        className={`admin-drawer ${active ? 'active' : ''}`} 
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(850px, 100vw)',
          height: '100vh',
          background: 'var(--bg-1)',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          transform: active ? 'translateX(0)' : 'translateX(100%)',
          padding: 'var(--space-6)',
          overflowY: 'hidden'
        }}
      >
        {/* Drawer Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-strong)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${getStatusBadgeClass(order.status || order.payment_status)}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                {type}
              </span>
              <h3 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>Order #{order.id}</h3>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Created: {formatDate(order.created_at || order.date)}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} style={{ padding: '4px 8px' }}>
            <i className="fa-light fa-sharp fa-xmark" style={{ fontSize: '18px' }} />
          </button>
        </div>

        {/* Drawer Content */}
        <form onSubmit={handleManualSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 'var(--space-6)', flex: 1 }} className="grid-mobile-1">
            
            {/* ── LEFT COLUMN: ORDER CONTENT & PRICING ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              
              {/* Ordered Type Tag */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>Order Category</span>
                <strong style={{ fontSize: '15px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{getOrderTypeLabel()}</strong>
              </div>

              {/* Order Visuals & Specs */}
              <div style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', background: 'var(--bg-2)' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border-strong)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.5px' }}>Ordered Items & Preview</h4>
                
                {/* 1. Projects (Image + details) */}
                {type === 'project' && (
                  <div 
                    onClick={handleProjectItemClick}
                    style={{ 
                      padding: '12px 16px', 
                      background: hoveredItemIdx === 'proj' ? 'var(--bg-1)' : 'var(--bg-3)', 
                      border: hoveredItemIdx === 'proj' ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={() => setHoveredItemIdx('proj')}
                    onMouseLeave={() => setHoveredItemIdx(null)}
                    title="Click to view full specifications & schedule"
                  >
                    {order.project_image_url && (
                      <div style={{ marginBottom: '12px' }}>
                        <img src={order.project_image_url} alt="" style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', border: '1px solid var(--border-strong)' }} />
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-sm)' }}>
                      <div><strong>Project Title:</strong> {order.project_name}</div>
                      <div><strong>Project ID:</strong> #{order.project_id}</div>
                      {order.order_type === 'rent' && (
                        <div style={{ padding: '8px', background: 'var(--bg-3)', borderLeft: '3px solid var(--warning)', fontSize: 'var(--text-xs)', marginTop: '4px', lineHeight: 1.5 }}>
                          <div><strong>Rental Period:</strong> {order.rental_duration_days} Days</div>
                          <div style={{ color: 'var(--text-0)', fontWeight: 600, marginTop: '2px' }}>({order.rental_start_date ? order.rental_start_date.substring(0, 10) : ''} to {order.rental_end_date ? order.rental_end_date.substring(0, 10) : ''})</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>
                        <i className="fa-light fa-sharp fa-eye" style={{ color: 'var(--accent)' }} /> Click to view details
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Store Products (List with thumbnails) */}
                {type === 'store' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Array.isArray(order.items) ? order.items.map((item, idx) => {
                      const isHovered = hoveredItemIdx === idx;
                      return (
                        <div 
                          key={idx} 
                          onMouseEnter={() => setHoveredItemIdx(idx)}
                          onMouseLeave={() => setHoveredItemIdx(null)}
                          onClick={() => setSelectedItemDetail(item)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px', 
                            background: isHovered ? 'var(--bg-1)' : 'var(--bg-3)', 
                            padding: '12px 16px', 
                            border: isHovered ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            position: 'relative'
                          }}
                          title="Click to view full item specifications & attachments"
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', border: '1px solid var(--border-strong)' }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                              <i className="fa-light fa-tag" style={{ color: 'var(--text-3)' }} />
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-0)' }}>{item.product_name || item.name}</strong>
                            {item.attributes && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{item.attributes}</div>}
                            {renderItemCustomResponses(item)}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <div style={{ fontSize: '11.5px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>Rs. {Number(item.price).toLocaleString()}</div>
                              <span style={{ fontSize: '10px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <i className="fa-light fa-sharp fa-eye" style={{ color: 'var(--accent)' }} /> Details / Files
                              </span>
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', background: 'var(--bg-1)', color: 'var(--accent)', border: '1px solid var(--border-strong)', marginLeft: '8px' }}>
                            x{item.quantity}
                          </span>
                        </div>
                      );
                    }) : (
                      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>No product details found.</span>
                    )}
                  </div>
                )}

                {/* 3. 3D Printing (Specs + Render) */}
                {type === 'print' && (
                  <div 
                    onClick={handlePrintItemClick}
                    style={{ 
                      padding: '12px 16px', 
                      background: hoveredItemIdx === 'print' ? 'var(--bg-1)' : 'var(--bg-3)', 
                      border: hoveredItemIdx === 'print' ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={() => setHoveredItemIdx('print')}
                    onMouseLeave={() => setHoveredItemIdx(null)}
                    title="Click to open interactive 3D model viewer"
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 'var(--text-sm)' }}>
                      <div><strong>File name:</strong>{' '}<span style={{ color: 'var(--info)', textDecoration: 'underline' }}>{order.filename}</span></div>
                      <div><strong>Filament Material:</strong> {order.material}</div>
                      <div><strong>Color Specs:</strong> {order.color}</div>
                      <div><strong>Volume Units:</strong> {order.quantity} pcs</div>
                      <div><strong>Resolution:</strong> {order.layer_height_mm} mm</div>
                      <div><strong>Density Infill:</strong> {order.infill_percentage}%</div>
                      <div><strong>Estimated weight:</strong> {order.estimated_weight_g || 'N/A'} g</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
                      <i className="fa-light fa-sharp fa-eye" style={{ color: 'var(--accent)' }} /> Click to view interactive 3D model details
                    </div>
                  </div>
                )}


              </div>

              {/* Total Costing Details & Payment */}
              <div style={{ border: '1px solid var(--border-strong)', padding: 'var(--space-4)', background: 'var(--bg-2)' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border-strong)', paddingBottom: '6px', marginBottom: '12px', letterSpacing: '0.5px' }}>Financial Summary & Payment</h4>
                
                {/* 3D Print price setter */}
                {type === 'print' && (
                  <div style={{ background: 'var(--bg-3)', padding: '12px', border: '1px solid var(--border-strong)', marginBottom: '16px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: 600, fontSize: '12px' }}>MANUALLY ASSIGN JOB PRICE (Rs.)</label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <input 
                          type="number" step="0.01" value={localPrice} 
                          onChange={e => setLocalPrice(e.target.value)} 
                          onBlur={handleInputBlur}
                          className="form-input" placeholder="Set price manually" 
                          style={{ maxWidth: '200px' }}
                        />
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleInputBlur}>Apply Price</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rental details breakdown */}
                {type === 'project' && order.order_type === 'rent' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--text-2)', marginBottom: '12px', background: 'var(--bg-3)', padding: '10px', border: '1px solid var(--border-strong)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Weekly Rental Rate:</span>
                      <span className="font-mono">Rs. {Number(order.rental_rate || 0).toLocaleString()} / wk</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Rental Duration:</span>
                      <span className="font-mono">{order.rental_duration_days} Days</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Refundable Security Deposit:</span>
                      <span className="font-mono">Rs. {Number(order.rental_deposit || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--text-3)' }}>Payment Method:</span>{' '}
                      <strong className="font-mono" style={{ textTransform: 'uppercase', color: 'var(--text-0)' }}>
                        {order.payment_method === 'wallet' ? 'Wallet Balance' : order.payment_method || 'COD (Cash)'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderLeft: '1px solid var(--border-strong)', paddingLeft: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Subtotal:</span>
                      <span className="font-mono">Rs. {netAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-3)' }}>Tax (13% VAT):</span>
                      <span className="font-mono">Rs. {taxAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-strong)', paddingTop: '4px', marginTop: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                      <span style={{ color: 'var(--accent)' }}>Total:</span>
                      <span className="font-mono" style={{ color: 'var(--accent)' }}>Rs. {grossTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* ── RIGHT COLUMN: CLIENT INFO, MAPS, ACTIONS ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', borderLeft: '1px solid var(--border-strong)', paddingLeft: 'var(--space-6)' }} className="no-border-mobile no-padding-mobile">
              
              {/* Customer Account Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', letterSpacing: '0.5px' }}>Client Profile</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-2)', padding: '12px', border: '1px solid var(--border-strong)' }}>
                  {customerAvatar ? (
                    <img src={customerAvatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-strong)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                      <i className="fa-light fa-user-astronaut" style={{ fontSize: '20px', color: 'var(--text-2)' }}></i>
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-0)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{customerName}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>ID: {userId ? `#${userId}` : 'GUEST / OFF-ACCOUNT'}</div>
                  </div>
                </div>
              </div>

              {/* Customer Contact Card */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>Contact Information</span>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-2)', padding: '12px', border: '1px solid var(--border-strong)' }}>
                  <div>
                    <i className="fa-light fa-envelope" style={{ marginRight: '8px', color: 'var(--text-3)' }} />
                    <a href={`mailto:${customerEmail}`} style={{ color: 'var(--info)', textDecoration: 'underline' }}>{customerEmail}</a>
                  </div>
                  <div>
                    <i className="fa-light fa-phone" style={{ marginRight: '8px', color: 'var(--text-3)' }} />
                    <a href={`tel:${customerPhone}`} style={{ color: 'var(--text-1)' }}>{customerPhone}</a>
                  </div>
                </div>
              </div>

              {/* Order Shipping Address & Map Coordinates */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>Delivery Destination</span>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-2)', padding: '12px', border: '1px solid var(--border-strong)', lineHeight: 1.4 }}>
                  <div>{addressString}</div>
                  {lat && lng && (
                    <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginBottom: '6px' }}>Geolocation Coordinates ({lat.toFixed(4)}, {lng.toFixed(4)})</span>
                      <a 
                        href={`https://maps.google.com/?q=${lat},${lng}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline btn-sm" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '0px', width: '100%', fontSize: '11px' }}
                      >
                        <i className="fa-light fa-sharp fa-map-location-dot" /> View location on Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Store Tracking Input */}
              {type === 'store' && (
                <div className="form-group" style={{ background: 'var(--bg-2)', padding: '12px', border: '1px solid var(--border-strong)' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fulfillment Tracking ID</label>
                  <input 
                    type="text" 
                    value={localTracking} 
                    onChange={e => setLocalTracking(e.target.value)} 
                    onBlur={handleInputBlur}
                    className="form-input" 
                    placeholder="e.g. DHL-9812-NP" 
                    style={{ marginTop: '4px' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>Saves automatically when you click away.</span>
                </div>
              )}

              {/* Web Lead Notes */}
              {type === 'web' && (
                <div className="form-group" style={{ background: 'var(--bg-2)', padding: '12px', border: '1px solid var(--border-strong)' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin Lead Notes</label>
                  <textarea 
                    value={localNotes} 
                    onChange={e => setLocalNotes(e.target.value)} 
                    onBlur={handleInputBlur}
                    className="form-input" 
                    placeholder="Write private notes on consultation progress..." 
                    style={{ minHeight: '80px', marginTop: '4px', resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>Saves automatically when you click away.</span>
                </div>
              )}

              {/* Status Chips Updates */}
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>Order Status (Click to update)</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {statusOptions.map(opt => {
                    const isSelected = localStatus === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleStatusChange(opt)}
                        className={`badge ${isSelected ? getStatusBadgeClass(opt) : 'badge--neutral'}`}
                        style={{
                          cursor: 'pointer',
                          padding: '6px 10px',
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          fontWeight: isSelected ? '700' : '400',
                          border: isSelected ? '1px solid transparent' : '1px solid var(--border-strong)',
                          borderRadius: '0px',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {opt.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status Chips (if applicable) */}
              {(type === 'store' || type === 'project') && (
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>Payment Status (Click to update)</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['unpaid', 'paid', 'refunded'].map(opt => {
                      const isSelected = localPayment === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handlePaymentChange(opt)}
                          className={`badge ${isSelected ? (opt === 'paid' ? 'badge--success' : opt === 'unpaid' ? 'badge--warning' : 'badge--danger') : 'badge--neutral'}`}
                          style={{
                            cursor: 'pointer',
                            padding: '6px 10px',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            fontWeight: isSelected ? '700' : '400',
                            border: isSelected ? '1px solid transparent' : '1px solid var(--border-strong)',
                            borderRadius: '0px',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div style={{ borderTop: '1px solid var(--border-strong)', paddingTop: '16px', marginTop: '24px', display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button type="button" className="btn btn-outline" onClick={handleClose} style={{ flex: 1 }}>
              Close Panel
            </button>
            <button type="submit" className="btn btn-primary" disabled={updating} style={{ flex: 2 }}>
              {updating ? (
                <><i className="fa-light fa-spinner-third fa-spin" style={{ marginRight: '8px' }} /> Saving changes...</>
              ) : (
                <><i className="fa-light fa-floppy-disk" style={{ marginRight: '8px' }} /> Save & Update manually</>
              )}
            </button>
          </div>

        </form>
      </div>

      {/* ── ITEM DETAILS SPECIFICATIONS MODAL ── */}
      {selectedItemDetail && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0, 0, 0, 0.85)', 
            backdropFilter: 'blur(6px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 99999,
            padding: '20px'
          }}
          onClick={() => setSelectedItemDetail(null)}
        >
          <div 
            style={{ 
              background: 'var(--bg-2)', 
              border: '1px solid var(--border-strong)', 
              borderRadius: '8px', 
              maxWidth: '650px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-strong)', background: 'var(--bg-3)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Item Specifications
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedItemDetail(null)}
                style={{ padding: '4px 8px' }}
              >
                <i className="fa-light fa-sharp fa-xmark" style={{ fontSize: '16px' }} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Product Info Summary */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                {selectedItemDetail.image_url ? (
                  <img src={selectedItemDetail.image_url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid var(--border-strong)' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-strong)' }}>
                    <i className="fa-light fa-tag" style={{ fontSize: '24px', color: 'var(--text-3)' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-0)', fontWeight: 'bold' }}>{selectedItemDetail.product_name || selectedItemDetail.name}</h4>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-3)' }}>
                    <span>Quantity: <strong>x{selectedItemDetail.quantity}</strong></span>
                    <span>Price: <strong>Rs. {Number(selectedItemDetail.price).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>

              {/* Specs & Custom Options details */}
              {(() => {
                let parsed = null;
                try {
                  parsed = typeof selectedItemDetail.custom_responses === 'string' 
                    ? JSON.parse(selectedItemDetail.custom_responses) 
                    : selectedItemDetail.custom_responses;
                } catch(e){}

                const isProject = selectedItemDetail.is_project || (parsed && parsed.rental_meta);
                const is3D = selectedItemDetail.is_3d || (parsed && (parsed.material || parsed.fileUrl || parsed.file_url));

                if (isProject) {
                  const rental = parsed?.rental_meta || {};
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h5 style={{ margin: 0, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.5px' }}>Project Details</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', background: 'var(--bg-3)', padding: '12px', border: '1px solid var(--border)' }}>
                        <div><strong>Offer Type:</strong> {rental.duration ? 'Rental (Lease)' : 'Outright Purchase'}</div>
                        {rental.duration && (
                          <>
                            <div><strong>Rental Duration:</strong> {rental.duration} Days</div>
                            <div><strong>Start Date:</strong> {rental.startDate}</div>
                            <div><strong>End Date:</strong> {rental.endDate}</div>
                            <div><strong>Security Deposit:</strong> Rs. {Number(rental.deposit || 0).toLocaleString()}</div>
                            <div><strong>Total Rental Cost:</strong> Rs. {Number(rental.rentalPrice || 0).toLocaleString()}</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                if (is3D) {
                  const fileUrl = parsed?.fileUrl || parsed?.file_url;
                  const filename = parsed?.filename || 'model.stl';
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h5 style={{ margin: 0, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.5px' }}>3D Printing Parameters</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', background: 'var(--bg-3)', padding: '12px', border: '1px solid var(--border)' }}>
                        <div><strong>Filament Material:</strong> {parsed?.material || 'PLA'}</div>
                        <div><strong>Color Specs:</strong> {parsed?.color || 'N/A'}</div>
                        <div><strong>Infill Density:</strong> {parsed?.infill || '100'}%</div>
                        <div><strong>Layer Height:</strong> {parsed?.layerHeight || '0.2'} mm</div>
                        {parsed?.notes && <div style={{ gridColumn: 'span 2' }}><strong>Instructions:</strong> {parsed.notes}</div>}
                      </div>

                      {fileUrl && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed var(--border)', paddingTop: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '13px' }}>Model File: {filename}</strong>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-outline btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              download
                            >
                              <i className="fa-light fa-sharp fa-download" /> Download File
                            </a>
                          </div>
                          
                          {/* 3D Visualizer Render inside modal */}
                          <div style={{ border: '1px solid var(--border-strong)', padding: '8px', background: 'var(--bg-1)', borderRadius: '4px' }}>
                            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-3)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                              3D Interactive Model Viewer
                            </span>
                            <AdminThreeDPreview fileUrl={fileUrl} filename={filename} color={parsed?.color || 'Black'} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }



                return (
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    No custom specifications or file parameters are associated with this standard catalog product.
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border-strong)', background: 'var(--bg-3)' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => setSelectedItemDetail(null)}
              >
                Close Specifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
