import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../store/CartContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import Footer from '../components/Footer';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ThreeMFLoader } from 'three/examples/jsm/loaders/3MFLoader';

// Material densities (g/cm3)
const MATERIAL_DENSITIES = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.21,
  Resin: 1.20,
  ASA: 1.07
};

// Client-side signed volume calculation for a closed 3D triangle mesh
const calculateVolume = (geometry) => {
  let volume = 0;
  const position = geometry.attributes.position;
  if (!position) return 0;
  
  const posArray = position.array;
  const index = geometry.index;
  
  if (index) {
    const indexArray = index.array;
    const faces = index.count / 3;
    for (let i = 0; i < faces; i++) {
      const idx1 = indexArray[i * 3 + 0];
      const idx2 = indexArray[i * 3 + 1];
      const idx3 = indexArray[i * 3 + 2];
      
      const x1 = posArray[idx1 * 3 + 0];
      const y1 = posArray[idx1 * 3 + 1];
      const z1 = posArray[idx1 * 3 + 2];
      
      const x2 = posArray[idx2 * 3 + 0];
      const y2 = posArray[idx2 * 3 + 1];
      const z2 = posArray[idx2 * 3 + 2];
      
      const x3 = posArray[idx3 * 3 + 0];
      const y3 = posArray[idx3 * 3 + 1];
      const z3 = posArray[idx3 * 3 + 2];
      
      // Signed volume of tetrahedron
      const v321 = x3 * y2 * z1;
      const v231 = x2 * y3 * z1;
      const v312 = x3 * y1 * z2;
      const v132 = x1 * y3 * z2;
      const v213 = x2 * y1 * z3;
      const v123 = x1 * y2 * z3;
      
      volume += (-v321 + v231 + v312 - v132 - v213 + v123);
    }
  } else {
    const faces = position.count / 3;
    for (let i = 0; i < faces; i++) {
      const idx1 = i * 3 + 0;
      const idx2 = i * 3 + 1;
      const idx3 = i * 3 + 2;
      
      const x1 = posArray[idx1 * 3 + 0];
      const y1 = posArray[idx1 * 3 + 1];
      const z1 = posArray[idx1 * 3 + 2];
      
      const x2 = posArray[idx2 * 3 + 0];
      const y2 = posArray[idx2 * 3 + 1];
      const z2 = posArray[idx2 * 3 + 2];
      
      const x3 = posArray[idx3 * 3 + 0];
      const y3 = posArray[idx3 * 3 + 1];
      const z3 = posArray[idx3 * 3 + 2];
      
      // Signed volume of tetrahedron
      const v321 = x3 * y2 * z1;
      const v231 = x2 * y3 * z1;
      const v312 = x3 * y1 * z2;
      const v132 = x1 * y3 * z2;
      const v213 = x2 * y1 * z3;
      const v123 = x1 * y2 * z3;
      
      volume += (-v321 + v231 + v312 - v132 - v213 + v123);
    }
  }
  return Math.abs(volume / 6);
};

// Interactive 3D WebGL preview component
function ThreeDViewer({ geometry, objGroup, color, material, dimensions }) {
  const { theme } = useTheme();
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [autoRotate, setAutoRotate] = useState(true);

  // Map user color selection to hex values for rendering
  const colorMap = {
    Black: 0x1f1f22,
    White: 0xf9f9fc,
    Silver: 0xbac0ca,
    Red: 0xdf2222,
    Blue: 0x2262df
  };

  const selectedHex = colorMap[color] || 0x1f1f22;

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 350;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x0d0d0d : 0xf1f5f9);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 5000);
    camera.position.set(30, 30, 45);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting setup (multiple lights for premium metallic/depth highlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.75 : 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, isDark ? 1.0 : 0.85);
    dirLight1.position.set(40, 80, 40);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.35);
    dirLight2.position.set(-40, -20, -40);
    scene.add(dirLight2);

    // 5. Build Plate Grid Helper (resembles a 3D printer slicer platform)
    const gridColor = isDark ? 0x262626 : 0xcbd5e1;
    const gridHelper = new THREE.GridHelper(50, 50, 0x10b981, gridColor);
    gridHelper.position.y = -10;
    scene.add(gridHelper);

    // 6. Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // 7. Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI; // Allow viewing the bottom view below the build plate grid
    controls.minDistance = 5;
    controls.maxDistance = 2000;

    // 8. Custom physical material based on choices
    const getMaterial = () => {
      const isResin = material === 'Resin';
      const isTpu = material === 'TPU';
      const isAbs = material === 'ABS';
      const isPetg = material === 'PETG';

      return new THREE.MeshStandardMaterial({
        color: selectedHex,
        roughness: isTpu ? 0.85 : isResin ? 0.15 : isAbs ? 0.35 : isPetg ? 0.25 : 0.45,
        metalness: color === 'Silver' ? 0.85 : 0.05,
        transparent: isResin,
        opacity: isResin ? 0.65 : 1.0,
        side: THREE.DoubleSide
      });
    };

    // 9. Load Object inside Group
    let activeMesh = null;
    let defaultGeometry = null;

    if (objGroup) {
      const groupClone = objGroup.clone();
      groupClone.traverse((child) => {
        if (child.isMesh) {
          child.material = getMaterial();
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // 1. Scale to fit nicely on the build plate (target size ~25 units) first
      const box = new THREE.Box3().setFromObject(groupClone);
      const groupSize = new THREE.Vector3();
      box.getSize(groupSize);
      const maxDim = Math.max(groupSize.x, groupSize.y, groupSize.z);
      const targetSize = 25;
      if (maxDim > 0) {
        const scale = targetSize / maxDim;
        groupClone.scale.set(scale, scale, scale);
      }

      // Update matrices so that the subsequent bounding box calculation accounts for the scale
      groupClone.updateMatrixWorld(true);

      // 2. Center the group object relative to its scaled bounding box
      const boxScaled = new THREE.Box3().setFromObject(groupClone);
      const groupCenter = new THREE.Vector3();
      boxScaled.getCenter(groupCenter);
      groupClone.position.sub(groupCenter);

      modelGroup.add(groupClone);
    } else if (geometry) {
      const geomClone = geometry.clone();
      geomClone.center();
      
      // Scale to fit nicely on the build plate (target size ~25 units)
      geomClone.computeBoundingBox();
      const bbox = geomClone.boundingBox;
      const geomSize = new THREE.Vector3();
      bbox.getSize(geomSize);
      const maxDim = Math.max(geomSize.x, geomSize.y, geomSize.z);
      const targetSize = 25;
      if (maxDim > 0) {
        const scale = targetSize / maxDim;
        geomClone.scale(scale, scale, scale);
      }

      activeMesh = new THREE.Mesh(geomClone, getMaterial());
      activeMesh.castShadow = true;
      activeMesh.receiveShadow = true;
      modelGroup.add(activeMesh);
    } else {
      // Default sample 3D component (complex mathematical gear shape)
      defaultGeometry = new THREE.TorusKnotGeometry(7, 2.2, 120, 16);
      activeMesh = new THREE.Mesh(defaultGeometry, getMaterial());
      modelGroup.add(activeMesh);
    }

    // Camera centering logic around bounding box
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
    
    gridHelper.position.y = box.min.y - 0.5;

    camera.position.set(center.x + cameraZ * 0.4, center.y + cameraZ * 0.5, center.z + cameraZ * 1.1);
    camera.lookAt(center);
    controls.update();

    // 10. Animation render loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (autoRotate) {
        modelGroup.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      
      controls.dispose();

      if (rendererRef.current) {
        if (rendererRef.current.domElement) {
          rendererRef.current.domElement.remove();
        }
        rendererRef.current.dispose();
      }

      if (gridHelper) {
        gridHelper.geometry.dispose();
        gridHelper.material.dispose();
      }

      if (defaultGeometry) defaultGeometry.dispose();
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
    };
  }, [geometry, objGroup, color, material, autoRotate, theme]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '350px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Interactive Controls Overlay */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button 
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className="btn btn-sm"
          style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', color: 'var(--text-0)', border: '1px solid var(--glass-border)', padding: '6px 12px', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <i className={`fa-light fa-sharp fa-${autoRotate ? 'pause' : 'play'}`} style={{ color: 'var(--accent)' }} />
          {autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
        </button>
      </div>

      {dimensions && dimensions.x > 0 && (
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', color: 'var(--text-1)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', zIndex: 10 }}>
          Size: {dimensions.x} × {dimensions.y} × {dimensions.z} mm
        </div>
      )}
      
      {!geometry && !objGroup && (
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', border: '1px solid var(--glass-border)', color: 'var(--text-1)', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', zIndex: 10 }}>
          Previewing sample model
        </div>
      )}
    </div>
  );
}export default function ThreeDService() {
  const { user, authFetch, systemConfig } = useAuth();
  const navigate = useNavigate();

  // Parse custom configurations
  const formDesign = systemConfig?.formDesign3d ? (() => {
    try {
      return typeof systemConfig.formDesign3d === 'string' ? JSON.parse(systemConfig.formDesign3d) : systemConfig.formDesign3d;
    } catch(e) { return {}; }
  })() : {};

  const filamentInfo = systemConfig?.filamentInfo3d ? (() => {
    try {
      return typeof systemConfig.filamentInfo3d === 'string' ? JSON.parse(systemConfig.filamentInfo3d) : systemConfig.filamentInfo3d;
    } catch(e) { return {}; }
  })() : {};

  // Form Fields setup
  const fields = formDesign.fields || [
    { id: "file", label: "3D Model File (.stl, .obj, .3mf)", type: "file", required: true },
    { id: "material", label: "Material", type: "select", required: true, options: [
      { name: "PLA", rate: 10 },
      { name: "PETG", rate: 15 },
      { name: "ABS", rate: 15 },
      { name: "TPU", rate: 25 },
      { name: "Resin", rate: 30 },
      { name: "ASA", rate: 20 }
    ]},
    { id: "color", label: "Color Selection", type: "select", required: true, options: [
      { name: "Black", rate: 0 },
      { name: "White", rate: 0 },
      { name: "Silver", rate: 0 },
      { name: "Red", rate: 0 },
      { name: "Blue", rate: 0 }
    ]},
    { id: "layerHeight", label: "Layer Height", type: "select", required: true, options: [
      { name: "0.12mm (Ultra-Fine)", rate: 0, value: 0.12 },
      { name: "0.16mm (Fine)", rate: 0, value: 0.16 },
      { name: "0.20mm (Standard)", rate: 0, value: 0.20 },
      { name: "0.28mm (Draft)", rate: 0, value: 0.28 }
    ]},
    { id: "qty", label: "Quantity", type: "number", required: true, defaultValue: 1 },
    { id: "infill", label: "Infill Density", type: "range", min: 10, max: 100, step: 5, required: true, defaultValue: 20 },
    { id: "notes", label: "Special instructions / Requirements", type: "textarea", required: false }
  ];

  const defaultFilaments = {
    PLA: { rate: 10.00, available: true },
    PETG: { rate: 15.00, available: true },
    ABS: { rate: 15.00, available: true },
    Resin: { rate: 30.00, available: true },
    ASA: { rate: 20.00, available: true },
    TPU: { rate: 25.00, available: true },
    setupFee: 50.00,
    minOrderPrice: 100.00
  };

  const mergedFilamentInfo = {
    ...defaultFilaments,
    ...filamentInfo
  };

  const materialField = fields.find(f => f.id === 'material') || {};
  const availableMaterials = (materialField.options || []).map(o => o.name);

  // States
  const { addToCart } = useCart();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'checkout' | 'add_to_cart'

  const [file, setFile] = useState(null);
  const [material, setMaterial] = useState('PLA');
  const [color, setColor] = useState('Black');
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.20);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [customResponses, setCustomResponses] = useState({});

  // Address checkout states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('Bagmati');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [parsingFile, setParsingFile] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Loaded 3D geometries
  const [uploadedGeometry, setUploadedGeometry] = useState(null);
  const [uploadedObjGroup, setUploadedObjGroup] = useState(null);
  const [meshVolume, setMeshVolume] = useState(0); // mm3
  const [meshDimensions, setMeshDimensions] = useState({ x: 0, y: 0, z: 0 });
  const [modelUnit, setModelUnit] = useState('auto'); // 'auto', 'mm', 'cm', 'in', 'm'

  const currentMaterial = availableMaterials.includes(material) ? material : (availableMaterials[0] || 'PLA');

  // Prepopulate addresses
  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setPhone(user.phone || '');
      const loadProfileAddress = async () => {
        try {
          const res = await authFetch('/api/store/profile/addresses');
          if (res.ok) {
            const data = await res.json();
            const def = data.find(a => a.is_default) || data[0];
            if (def) {
              setFullName(def.full_name || user.name || '');
              setPhone(def.phone || user.phone || '');
              setAddressLine(def.address_line || '');
              setCity(def.city || '');
              setDistrict(def.district || '');
              setProvince(def.province || 'Bagmati');
              setLat(def.lat || '');
              setLng(def.lng || '');
            }
          }
        } catch(e) {}
      };
      loadProfileAddress();
    }
  }, [user]);

  const getScaledSpecs = () => {
    let scale = 1;
    let autoUnit = 'mm';
    
    if (modelUnit === 'auto') {
      // Auto-detect based on bounding box size
      const maxDim = Math.max(meshDimensions.x, meshDimensions.y, meshDimensions.z);
      if (maxDim > 0 && maxDim < 2.0) {
        // Likely in meters (e.g. 0.15m = 150mm)
        scale = 1000;
        autoUnit = 'm';
      } else {
        scale = 1;
        autoUnit = 'mm';
      }
    } else if (modelUnit === 'cm') {
      scale = 10;
    } else if (modelUnit === 'in') {
      scale = 25.4;
    } else if (modelUnit === 'm') {
      scale = 1000;
    } else {
      scale = 1; // 'mm'
    }
    
    return {
      volume: meshVolume * Math.pow(scale, 3),
      dimensions: {
        x: Math.round(meshDimensions.x * scale),
        y: Math.round(meshDimensions.y * scale),
        z: Math.round(meshDimensions.z * scale)
      },
      scale: scale,
      autoUnit: autoUnit
    };
  };

  // Exact client-side gram and pricing calculation
  const calculateEstimate = () => {
    const setupFee = formDesign.setupFee !== undefined ? parseFloat(formDesign.setupFee) : (mergedFilamentInfo.setupFee !== undefined ? parseFloat(mergedFilamentInfo.setupFee) : 50);
    const materialCostPerGram = mergedFilamentInfo[currentMaterial]?.rate !== undefined 
      ? parseFloat(mergedFilamentInfo[currentMaterial].rate) 
      : (currentMaterial === 'Resin' ? 30 : currentMaterial === 'TPU' ? 25 : 10);
    
    // Use uploaded mesh volume (scaled to mm3), fallback to a standard sample component volume of 20000 mm3 (20 cm3)
    const specs = getScaledSpecs();
    const finalVolumeMm3 = file ? specs.volume : 20000;
    const density = MATERIAL_DENSITIES[currentMaterial] || 1.24;
    
    // Infill density scales the internal volume. Shell is assumed to take 25% volume, infill scales the remaining 75%.
    // Plus a 20% overhead to ensure estimated weights are never less than the actual weight (safely covering support structures, rafts, brims, purge lines).
    const infillFactor = 0.25 + 0.75 * (infill / 100);
    
    const weightGrams = (finalVolumeMm3 / 1000) * density * infillFactor * qty * 1.20;
    const totalEstimate = setupFee + (weightGrams * materialCostPerGram);
    
    const minPrice = formDesign.minOrderPrice !== undefined ? parseFloat(formDesign.minOrderPrice) : (mergedFilamentInfo.minOrderPrice || 100);
    return {
      weight: Math.round(weightGrams * 10) / 10, // precision to 1 decimal place
      price: Math.max(minPrice, Math.round(totalEstimate))
    };
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      const nameLower = uploadedFile.name.toLowerCase();
      if (!nameLower.endsWith('.stl') && !nameLower.endsWith('.obj') && !nameLower.endsWith('.3mf')) {
        setError('Only .stl, .obj or .3mf 3D model files are supported.');
        setFile(null);
        setUploadedGeometry(null);
        setUploadedObjGroup(null);
        setMeshVolume(0);
        setMeshDimensions({ x: 0, y: 0, z: 0 });
      } else {
        setError('');
        setFile(uploadedFile);
        setParsingFile(true);
        
        const url = URL.createObjectURL(uploadedFile);
        
        if (nameLower.endsWith('.stl')) {
          const loader = new STLLoader();
          loader.load(url, (geom) => {
            geom.center();
            const vol = calculateVolume(geom);
            setMeshVolume(vol);
            
            geom.computeBoundingBox();
            const bbox = geom.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            setMeshDimensions({
              x: Math.round(size.x),
              y: Math.round(size.y),
              z: Math.round(size.z)
            });
            
            setUploadedGeometry(geom);
            setUploadedObjGroup(null);
            setParsingFile(false);
            URL.revokeObjectURL(url);
          }, undefined, (err) => {
            console.error(err);
            setError('Failed to parse STL file. Mesh geometry may be corrupted.');
            setParsingFile(false);
            URL.revokeObjectURL(url);
          });
        } else if (uploadedFile.name.endsWith('.obj')) {
          const loader = new OBJLoader();
          loader.load(url, (obj) => {
            obj.updateMatrixWorld(true);
            let totalVolume = 0;
            obj.traverse((child) => {
              if (child.isMesh) {
                const geom = child.geometry.clone();
                geom.applyMatrix4(child.matrixWorld);
                totalVolume += calculateVolume(geom);
                geom.dispose();
              }
            });
            setMeshVolume(totalVolume);
            
            const box = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3();
            box.getSize(size);
            setMeshDimensions({
              x: Math.round(size.x),
              y: Math.round(size.y),
              z: Math.round(size.z)
            });
            
            setUploadedObjGroup(obj);
            setUploadedGeometry(null);
            setParsingFile(false);
            URL.revokeObjectURL(url);
          }, undefined, (err) => {
            console.error(err);
            setError('Failed to parse OBJ file. Ensure it is a valid OBJ model.');
            setParsingFile(false);
            URL.revokeObjectURL(url);
          });
        } else if (nameLower.endsWith('.3mf')) {
          // 3MF files are ZIP archives — read as ArrayBuffer and parse directly
          // to avoid issues with XHR blob URL fetching for arraybuffer response types
          URL.revokeObjectURL(url);
          const reader = new FileReader();
          reader.onload = (readerEvent) => {
            try {
              const loader = new ThreeMFLoader();
              const obj = loader.parse(readerEvent.target.result);
              obj.updateMatrixWorld(true);
              
              let totalVolume = 0;
              let meshCount = 0;

              obj.traverse((child) => {
                if (child.isMesh) {
                  meshCount++;
                  const geom = child.geometry.clone();
                  geom.applyMatrix4(child.matrixWorld);
                  
                  const vol = calculateVolume(geom);
                  totalVolume += vol;
                  
                  geom.dispose();
                }
              });

              // Fallback: if signed-volume method returned 0 (non-watertight mesh),
              // estimate volume from the bounding box with a 30% fill factor
              if (totalVolume <= 0 && meshCount > 0) {
                console.warn('[3D] Signed-volume returned 0 for 3MF — using bounding-box fallback.');
                const fallbackBox = new THREE.Box3().setFromObject(obj);
                const fbSize = new THREE.Vector3();
                fallbackBox.getSize(fbSize);
                totalVolume = fbSize.x * fbSize.y * fbSize.z * 0.30;
              }

              setMeshVolume(totalVolume);

              const box = new THREE.Box3().setFromObject(obj);
              const size = new THREE.Vector3();
              box.getSize(size);
              setMeshDimensions({
                x: Math.round(size.x),
                y: Math.round(size.y),
                z: Math.round(size.z)
              });

              setUploadedObjGroup(obj);
              setUploadedGeometry(null);
              setParsingFile(false);
            } catch (err) {
              console.error('3MF parse error:', err);
              setError('Failed to parse 3MF file. Ensure it is a valid 3D Manufacturing Format model.');
              setParsingFile(false);
            }
          };
          reader.onerror = () => {
            setError('Failed to read 3MF file.');
            setParsingFile(false);
          };
          reader.readAsArrayBuffer(uploadedFile);
        }
      }
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setUploadedGeometry(null);
    setUploadedObjGroup(null);
    setMeshVolume(0);
    setMeshDimensions({ x: 0, y: 0, z: 0 });
    setError('');
  };

  const handleTriggerAction = (action) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    const hasFileField = fields.some(f => f.id === 'file');
    if (hasFileField && !file) {
      setError('Please upload a 3D model file (.stl, .obj, or .3mf).');
      return;
    }
    setError('');
    setMessage('');
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError('');
    setMessage('');

    let fileUrl = '';
    let filename = '';

    try {
      if (file) {
        const uploadData = new FormData();
        uploadData.append('modelFile', file);
        const uploadRes = await authFetch('/api/3d/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.message || 'File upload failed');
        }
        fileUrl = uploadJson.fileUrl;
        filename = uploadJson.filename;
      }

      const specs = getScaledSpecs();
      const orderData = {
        material: currentMaterial,
        color: color,
        layerHeight: layerHeight,
        infill: infill,
        qty: qty,
        notes: notes,
        file_url: fileUrl,
        filename: filename,
        price: estimate.price,
        weight: estimate.weight,
        dimensions: `${specs.dimensions.x}x${specs.dimensions.y}x${specs.dimensions.z} mm`,
        unit_selected: modelUnit,
        customResponses: {
          ...customResponses,
          material: currentMaterial,
          color: color,
          infill: infill,
          layerHeight: layerHeight,
          qty: qty,
          notes: notes,
          weight: estimate.weight,
          dimensions: `${specs.dimensions.x}x${specs.dimensions.y}x${specs.dimensions.z} mm`,
          unit_selected: modelUnit
        }
      };

      if (pendingAction === 'add_to_cart') {
        await addToCart({
          is_3d: true,
          name: `3D Custom Print (${currentMaterial} - ${color})`,
          price: estimate.price,
          image_url: '/3d_placeholder.svg',
          custom_responses: orderData
        });
        setMessage('Successfully added custom print job to your cart!');
        setTimeout(() => setMessage(''), 5000);
      } else {
        navigate('/store/cart', {
          state: {
            checkoutType: '3d',
            printData: orderData
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error processing request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    if (field.id === 'file') {
      return (
        <div key={field.id} className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label" style={{ fontWeight: 600 }}>{field.label}</label>
          {!file ? (
            <div style={{ border: '2px dashed var(--border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--bg-1)', cursor: 'pointer', position: 'relative' }}>
              <input 
                type="file" 
                accept=".stl,.obj,.3mf" 
                onChange={handleFileChange}
                required={!!field.required}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <i className="fa-light fa-sharp fa-cloud-arrow-up" style={{ fontSize: '32px', color: 'var(--accent)', marginBottom: '8px', display: 'inline-block' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-2)', display: 'block' }}>Drag your file here or click to browse</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-light fa-sharp fa-file-check" style={{ color: 'var(--success)', fontSize: '18px' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-0)' }}>{file.name}</span>
              </div>
              <button 
                type="button" 
                onClick={handleClearFile} 
                className="btn btn-ghost btn-xs text-danger"
                style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <i className="fa-light fa-sharp fa-trash" /> Remove
              </button>
            </div>
          )}
          {file && (
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-2)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-0)', margin: 0, whiteSpace: 'nowrap' }}>Model Unit:</label>
              <select
                className="form-select"
                value={modelUnit}
                onChange={(e) => setModelUnit(e.target.value)}
                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '4px', background: 'var(--bg-1)', border: '1px solid var(--border)', color: 'var(--text-0)', cursor: 'pointer', flex: 1 }}
              >
                <option value="auto">Auto-detect ({getScaledSpecs().autoUnit === 'm' ? 'Meters ➔ scaled' : 'Millimeters'})</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="in">Inches (in)</option>
                <option value="m">Meters (m)</option>
              </select>
            </div>
          )}
        </div>
      );
    }

    if (field.type === 'select') {
      const val = field.id === 'material' ? material 
                : field.id === 'color' ? color 
                : field.id === 'layerHeight' ? layerHeight 
                : (customResponses[field.id] || (field.options && (field.options[0]?.value !== undefined ? field.options[0]?.value : field.options[0]?.name)) || '');

      const handleChange = (e) => {
        const value = e.target.value;
        if (field.id === 'material') setMaterial(value);
        else if (field.id === 'color') setColor(value);
        else if (field.id === 'layerHeight') setLayerHeight(value);
        else setCustomResponses(prev => ({ ...prev, [field.id]: value }));
      };

      return (
        <div key={field.id} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label" style={{ fontWeight: 600 }}>{field.label}</label>
          <select 
            className="form-select"
            value={val}
            onChange={handleChange}
            required={!!field.required}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '10px' }}
          >
            {field.options && field.options.map(opt => {
              const displayRate = opt.rate ? ` (+Rs. ${opt.rate}${field.id === 'material' ? '/g' : ''})` : '';
              return (
                <option key={opt.name} value={opt.value !== undefined ? opt.value : opt.name}>
                  {opt.name}{displayRate}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

    if (field.type === 'range') {
      const val = field.id === 'infill' ? infill : (customResponses[field.id] || field.defaultValue || 20);
      const handleChange = (e) => {
        const value = parseInt(e.target.value, 10);
        if (field.id === 'infill') setInfill(value);
        else setCustomResponses(prev => ({ ...prev, [field.id]: value }));
      };

      return (
        <div key={field.id} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="form-label" style={{ fontWeight: 600, margin: 0 }}>{field.label} ({val}%)</label>
            <span style={{ fontSize: '11px', background: 'var(--text-0)', color: 'var(--bg-1)', padding: '2px 6px', fontWeight: 'bold' }}>{val}%</span>
          </div>
          <input 
            type="range"
            min={field.min || 10}
            max={field.max || 100}
            step={field.step || 5}
            value={val}
            onChange={handleChange}
            className="custom-range-slider"
            style={{ cursor: 'pointer' }}
          />
        </div>
      );
    }

    if (field.type === 'textarea') {
      const val = field.id === 'notes' ? notes : (customResponses[field.id] || '');
      const handleChange = (e) => {
        const value = e.target.value;
        if (field.id === 'notes') setNotes(value);
        else setCustomResponses(prev => ({ ...prev, [field.id]: value }));
      };

      return (
        <div key={field.id} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label className="form-label" style={{ fontWeight: 600 }}>{field.label}</label>
          <textarea 
            value={val}
            onChange={handleChange}
            required={!!field.required}
            className="form-textarea"
            placeholder={`Enter ${field.label}...`}
            style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '10px', minHeight: '80px' }}
          />
        </div>
      );
    }

    const val = field.id === 'qty' ? qty : (customResponses[field.id] || field.defaultValue || '');
    const handleChange = (e) => {
      const value = parseInt(e.target.value, 10);
      if (field.id === 'qty') setQty(value);
      else setCustomResponses(prev => ({ ...prev, [field.id]: value }));
    };

    return (
      <div key={field.id} className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
        <label className="form-label" style={{ fontWeight: 600 }}>{field.label}</label>
        <input 
          type="number"
          min="1"
          value={val}
          onChange={handleChange}
          required={!!field.required}
          className="form-input"
          style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '10px' }}
        />
      </div>
    );
  };

  const estimate = calculateEstimate();

  return (
    <>
      <div className="container" style={{ paddingTop: '100px', paddingBottom: 'var(--space-12)', minHeight: '80vh' }}>
      <SEO 
        title="Custom 3D Printing Service Nepal | Real-time Quote"
        description="Get instant price estimates for custom 3D printing in Nepal. Upload your STL, OBJ, or 3MF model, select material (PLA, ABS, Resin), and place your order online."
        keywords="3d printing nepal, custom 3d prints, buy 3d prints kathmandu, stl printing service, petg pla resin abs nepal"
        schema={{
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Custom 3D Printing Service",
          "serviceType": "3D Printing & Prototyping",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Himalix Labs",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Kathmandu",
              "addressCountry": "NP"
            }
          },
          "areaServed": {
            "@type": "Country",
            "name": "Nepal"
          },
          "description": "Premium 3D printing custom parts fabrication in Nepal. Supporting PLA, PETG, ABS, and Resin. Upload STL/OBJ/3MF files for real-time estimation.",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "NPR",
            "price": "100"
          }
        }}
      />

      <Breadcrumbs items={[
        { label: 'Services', path: '/#services' },
        { label: '3D Printing Studio' }
      ]} />

      <style>{`
        .custom-range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--border, #222);
          outline: none;
          margin: 12px 0;
          padding: 0;
        }

        .custom-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent, #d4a017);
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          border: 2px solid var(--bg-2, #111);
        }

        .custom-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 6px rgba(212, 160, 23, 0.2);
        }

        .custom-range-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent, #d4a017);
          cursor: pointer;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          border: 2px solid var(--bg-2, #111);
        }

        .custom-range-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 6px rgba(212, 160, 23, 0.2);
        }
      `}</style>
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title">3D Printing Studio</h1>
        <p className="page-subtitle">Upload your STL/OBJ/3MF model, customize print details, and watch real-time estimation updates.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-8)' }} className="grid-mobile-1">
        
        {/* Customizer Form Column */}
        <form onSubmit={(e) => e.preventDefault()} className="form-group" style={{ backgroundColor: 'var(--bg-2)', padding: 'var(--space-6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', letterSpacing: '0.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-light fa-sharp fa-sliders" style={{ color: 'var(--accent)' }} /> Configure Print Parameters
          </h2>
          
          {fields.map(field => renderField(field))}

          {error && <div className="alert alert-danger" style={{ marginTop: 'var(--space-4)' }}><i className="fa-light fa-sharp fa-circle-exclamation" style={{ marginRight: 6 }} /> {error}</div>}
          {message && <div className="alert alert-success" style={{ marginTop: 'var(--space-4)' }}><i className="fa-light fa-sharp fa-circle-check" style={{ marginRight: 6 }} /> {message}</div>}

          {parsingFile ? (
            <button type="button" className="btn btn-outline btn-full" style={{ marginTop: 'var(--space-6)', padding: '12px' }} disabled>
              Processing Mesh Geometry...
            </button>
          ) : user ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: 'var(--space-6)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ padding: '12px', fontWeight: 600, borderRadius: '4px' }}
                onClick={() => handleTriggerAction('add_to_cart')}
                disabled={loading}
              >
                Add to Cart
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ padding: '12px', fontWeight: 600, borderRadius: '4px' }}
                onClick={() => handleTriggerAction('checkout')}
                disabled={loading}
              >
                Proceed to Checkout
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary btn-full" 
              style={{ marginTop: 'var(--space-6)', padding: '12px', fontWeight: 600 }}
              onClick={() => navigate('/signin')}
            >
              Sign In to Place Order
            </button>
          )}
         </form>

        {showConfirmModal && (
          <div className="admin-modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="admin-modal" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-strong)', padding: '24px', maxWidth: '500px', width: '90%', borderRadius: '8px' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', color: 'var(--accent)' }}>
                Verify Custom Print Specifications
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
                Please review your selections carefully before proceeding:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-3)', padding: '16px', borderRadius: '4px', fontSize: '13px', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <div><strong>Model File:</strong> {file ? file.name : 'Sample component'}</div>
                <div><strong>Filament Material:</strong> {currentMaterial}</div>
                <div><strong>Selected Color:</strong> {color}</div>
                <div><strong>Infill Density:</strong> {infill}%</div>
                <div><strong>Layer Height:</strong> {layerHeight} mm</div>
                <div><strong>Print Quantity:</strong> {qty}</div>
                {notes && <div style={{ wordBreak: 'break-all' }}><strong>Instructions:</strong> {notes}</div>}
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-0)' }}>
                  <span>Simulated Estimate:</span>
                  <span>Rs. {estimate.price}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowConfirmModal(false)}>
                  Go Back & Edit
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleConfirmAction}>
                  Confirm & Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3D Visualizer & Estimation Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* WebGL 3D Preview Card */}
          <div style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', letterSpacing: '0.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-light fa-sharp fa-cube" style={{ color: 'var(--accent)' }} /> 3D Real-time Render
            </h2>
            
            {parsingFile ? (
              <div style={{ height: '350px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div className="spinner" style={{ borderColor: 'var(--accent) transparent transparent transparent' }} />
                <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Reading mesh coordinates and calculating volumes...</span>
              </div>
            ) : (
              <ThreeDViewer 
                file={file}
                geometry={uploadedGeometry}
                objGroup={uploadedObjGroup}
                color={color}
                material={currentMaterial}
                dimensions={getScaledSpecs().dimensions}
              />
            )}
          </div>

          {/* Pricing Estimator Summary Card */}
          <div style={{ backgroundColor: 'var(--bg-1)', border: '1px solid var(--border-strong)', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-display)', letterSpacing: '0.5px', fontWeight: 600 }}>Estimator Summary</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-2)' }}>Calculated Weight</span>
                <span className="font-mono" style={{ color: 'var(--text-0)', fontWeight: 600 }}>~ {estimate.weight} g</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-2)' }}>Setup & Prep Fee</span>
                <span className="font-mono" style={{ color: 'var(--text-0)', fontWeight: 600 }}>Rs. {mergedFilamentInfo.setupFee !== undefined ? mergedFilamentInfo.setupFee : 50}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-2)' }}>Material Rate ({currentMaterial})</span>
                <span className="font-mono" style={{ color: 'var(--text-0)', fontWeight: 600 }}>
                  Rs. {mergedFilamentInfo[currentMaterial]?.rate !== undefined ? mergedFilamentInfo[currentMaterial].rate : 10} / g
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--accent)', paddingBottom: '12px', marginTop: 'var(--space-3)' }}>
                <strong style={{ color: 'var(--text-0)', fontSize: '1.05rem' }}>Simulated Total Cost</strong>
                <strong className="font-mono" style={{ color: 'var(--accent)', fontSize: '1.35rem' }}>Rs. {estimate.price.toLocaleString()}</strong>
              </div>
            </div>
            <p style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: 'var(--space-4)', lineHeight: '1.6' }}>
              *Note: Bounding boxes and weights are calculated client-side in real-time. Final price is subject to minor inspection adjustments by Himalix laboratory technicians.
            </p>
          </div>

          {/* Material Guidelines Card */}
          <div style={{ backgroundColor: 'var(--bg-2)', border: '1px solid var(--border)', padding: 'var(--space-5)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-0)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px', fontWeight: 600 }}>Material Guideline</h3>
            <ul style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-2)', paddingLeft: 0, listStyle: 'none' }}>
              <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}><strong>PLA:</strong> Rapid prototyping & display models. Organic starch base (Density: 1.24 g/cm³).</li>
              <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}><strong>PETG:</strong> High structural strength & chemical/water resistance (Density: 1.27 g/cm³).</li>
              <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}><strong>ABS:</strong> Mechanical toughness & high heat resilience. Sandable/paintable (Density: 1.04 g/cm³).</li>
              <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}><strong>TPU:</strong> Flexible rubber-like properties. Ideal for gaskets, cases, dampeners (Density: 1.21 g/cm³).</li>
              <li style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}><strong>Resin:</strong> Extreme precision, detailed miniatures. Solid/translucent options (Density: 1.20 g/cm³).</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
    <Footer />
  </>
);
}
