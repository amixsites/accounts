import { useState, useEffect } from "react";
import { supabase, type Course, type Branch, type FeeType, type AcademicYear } from "../lib/supabaseClient";
import { Plus, Trash2 } from "lucide-react";

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'courses' | 'branches' | 'fee_types' | 'academic_years'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'courses':
          const { data: coursesData } = await supabase.from('courses').select('*').order('course_name');
          setCourses(coursesData || []);
          break;
        case 'branches':
          const { data: branchesData } = await supabase.from('branches').select('*, courses(course_name)').order('branch_name');
          setBranches(branchesData || []);
          break;
        case 'fee_types':
          const { data: feeTypesData } = await supabase.from('fee_types').select('*').order('fee_name');
          setFeeTypes(feeTypesData || []);
          break;
        case 'academic_years':
          const { data: yearsData } = await supabase.from('academic_years').select('*').order('year_name', { ascending: false });
          setAcademicYears(yearsData || []);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await supabase.from(activeTab).delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error deleting item');
    }
  };

  const renderCourses = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Courses Management</h3>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Add Course
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#ea580c', color: 'white' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left' }}>Course Code</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Course Name</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Duration (Years)</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course, idx) => (
            <tr key={course.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ padding: '12px' }}>{course.course_code}</td>
              <td style={{ padding: '12px' }}>{course.course_name}</td>
              <td style={{ padding: '12px' }}>{course.duration_years}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: course.is_active ? '#d1fae5' : '#fee2e2', color: course.is_active ? '#065f46' : '#991b1b' }}>
                  {course.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(course.id)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBranches = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Branches Management</h3>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#ea580c', color: 'white' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left' }}>Branch Code</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Branch Name</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Course</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {branches.map((branch, idx) => (
            <tr key={branch.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ padding: '12px' }}>{branch.branch_code}</td>
              <td style={{ padding: '12px' }}>{branch.branch_name}</td>
              <td style={{ padding: '12px' }}>{branch.courses?.course_name}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: branch.is_active ? '#d1fae5' : '#fee2e2', color: branch.is_active ? '#065f46' : '#991b1b' }}>
                  {branch.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(branch.id)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFeeTypes = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Fee Types Management</h3>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Add Fee Type
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#ea580c', color: 'white' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left' }}>Fee Code</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Fee Name</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {feeTypes.map((feeType, idx) => (
            <tr key={feeType.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ padding: '12px' }}>{feeType.fee_code}</td>
              <td style={{ padding: '12px' }}>{feeType.fee_name}</td>
              <td style={{ padding: '12px' }}>{feeType.description || '-'}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: feeType.is_active ? '#d1fae5' : '#fee2e2', color: feeType.is_active ? '#065f46' : '#991b1b' }}>
                  {feeType.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(feeType.id)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAcademicYears = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>Academic Years Management</h3>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} />
          Add Academic Year
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#ea580c', color: 'white' }}>
          <tr>
            <th style={{ padding: '15px', textAlign: 'left' }}>Year Name</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Start Date</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>End Date</th>
            <th style={{ padding: '15px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '15px', textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {academicYears.map((year, idx) => (
            <tr key={year.id} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fafafa' : 'white' }}>
              <td style={{ padding: '12px', fontWeight: 'bold' }}>{year.year_name}</td>
              <td style={{ padding: '12px' }}>{new Date(year.start_date).toLocaleDateString('en-IN')}</td>
              <td style={{ padding: '12px' }}>{new Date(year.end_date).toLocaleDateString('en-IN')}</td>
              <td style={{ padding: '12px' }}>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', background: year.is_active ? '#d1fae5' : '#fee2e2', color: year.is_active ? '#065f46' : '#991b1b', fontWeight: 'bold' }}>
                  {year.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(year.id)}
                  style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Manage courses, branches, fee types, and academic years</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        {[
          { value: 'courses', label: 'Courses' },
          { value: 'branches', label: 'Branches' },
          { value: 'fee_types', label: 'Fee Types' },
          { value: 'academic_years', label: 'Academic Years' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value as any);
              setShowAdd(false);
            }}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.value ? '#ea580c' : 'transparent',
              color: activeTab === tab.value ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.value ? '3px solid #ea580c' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {showAdd && (
              <div style={{ padding: '15px', background: '#e0f2fe', color: '#0369a1', borderRadius: '8px', marginBottom: '20px' }}>
                Adding items directly from this interface will be implemented in a future update. For now, please use the database.
              </div>
            )}
            {activeTab === 'courses' && renderCourses()}
            {activeTab === 'branches' && renderBranches()}
            {activeTab === 'fee_types' && renderFeeTypes()}
            {activeTab === 'academic_years' && renderAcademicYears()}
          </>
        )}
      </div>
    </div>
  );
}