/**
 * templates/index.js
 * Built-in table templates for Visual Table Builder.
 * Each template provides pre-populated tableData plus recommended settings.
 */

import { __ } from '@wordpress/i18n';
import { createCell } from '../utils/tableHelpers';

/**
 * Helper: Creates a cell with custom content and optional styles.
 *
 * @param {string} content        Cell content.
 * @param {Object} styleOverrides Optional style overrides.
 * @return {Object} Cell object.
 */
function cell( content = '', styleOverrides = {} ) {
	const c = createCell( content );
	c.styles = { ...c.styles, ...styleOverrides };
	return c;
}

const hdr = ( content ) =>
	cell( `<strong>${ content }</strong>`, {
		backgroundColor: '#4f46e5',
		color: '#ffffff',
		fontWeight: 'bold',
		textAlign: 'center',
	} );

const hdrAlt = ( content ) =>
	cell( `<strong>${ content }</strong>`, {
		backgroundColor: '#1e293b',
		color: '#ffffff',
		fontWeight: 'bold',
		textAlign: 'center',
	} );

const hdrGreen = ( content ) =>
	cell( `<strong>${ content }</strong>`, {
		backgroundColor: '#16a34a',
		color: '#ffffff',
		fontWeight: 'bold',
		textAlign: 'center',
	} );

export const TEMPLATES = [
	{
		id: 'blank',
		name: __( 'Blank Table', 'wstech-visual-table-builder' ),
		description: __(
			'Start from scratch with a 4×4 empty table.',
			'wstech-visual-table-builder'
		),
		icon: '📝',
		settings: { hasHeaderRow: true },
		tableData: [
			[
				hdr( __( 'Column 1', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Column 2', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Column 3', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Column 4', 'wstech-visual-table-builder' ) ),
			],
			[ cell(), cell(), cell(), cell() ],
			[ cell(), cell(), cell(), cell() ],
			[ cell(), cell(), cell(), cell() ],
		],
	},
	{
		id: 'employee-directory',
		name: __( 'Employee Directory', 'wstech-visual-table-builder' ),
		description: __(
			'Contact directory for team members.',
			'wstech-visual-table-builder'
		),
		icon: '👥',
		settings: {
			hasHeaderRow: true,
			sortable: true,
			searchable: true,
			hoverHighlight: true,
		},
		tableData: [
			[
				hdr( __( 'Name', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Department', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Email', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Phone', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Location', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Arjun Sharma', 'wstech-visual-table-builder' ) ),
				cell( __( 'Engineering', 'wstech-visual-table-builder' ) ),
				cell(
					__( 'arjun@company.com', 'wstech-visual-table-builder' )
				),
				cell( '+91 98765 43210' ),
				cell( __( 'Mumbai', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Priya Patel', 'wstech-visual-table-builder' ) ),
				cell( __( 'Marketing', 'wstech-visual-table-builder' ) ),
				cell(
					__( 'priya@company.com', 'wstech-visual-table-builder' )
				),
				cell( '+91 87654 32109' ),
				cell( __( 'Delhi', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Rahul Verma', 'wstech-visual-table-builder' ) ),
				cell( __( 'Sales', 'wstech-visual-table-builder' ) ),
				cell(
					__( 'rahul@company.com', 'wstech-visual-table-builder' )
				),
				cell( '+91 76543 21098' ),
				cell( __( 'Bangalore', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Sneha Gupta', 'wstech-visual-table-builder' ) ),
				cell( __( 'HR', 'wstech-visual-table-builder' ) ),
				cell(
					__( 'sneha@company.com', 'wstech-visual-table-builder' )
				),
				cell( '+91 65432 10987' ),
				cell( __( 'Chennai', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Amit Kumar', 'wstech-visual-table-builder' ) ),
				cell( __( 'Finance', 'wstech-visual-table-builder' ) ),
				cell( __( 'amit@company.com', 'wstech-visual-table-builder' ) ),
				cell( '+91 54321 09876' ),
				cell( __( 'Hyderabad', 'wstech-visual-table-builder' ) ),
			],
		],
	},
	{
		id: 'pricing-table',
		name: __( 'Pricing Table', 'wstech-visual-table-builder' ),
		description: __(
			'Compare pricing plans for products or services.',
			'wstech-visual-table-builder'
		),
		icon: '💰',
		settings: {
			hasHeaderRow: true,
			hoverHighlight: true,
			firstColumnHeader: true,
		},
		tableData: [
			[
				hdr( __( 'Feature', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Basic', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Pro', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Enterprise', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Monthly Price</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '₹999/mo', 'wstech-visual-table-builder' ) ),
				cell( __( '₹2,499/mo', 'wstech-visual-table-builder' ) ),
				cell( __( '₹7,999/mo', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Users</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '1' ),
				cell( '5' ),
				cell( __( 'Unlimited', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Storage</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '10 GB', 'wstech-visual-table-builder' ) ),
				cell( __( '100 GB', 'wstech-visual-table-builder' ) ),
				cell( __( '1 TB', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Support</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'Email', 'wstech-visual-table-builder' ) ),
				cell( __( 'Priority', 'wstech-visual-table-builder' ) ),
				cell( __( '24/7 Dedicated', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>API Access</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '✗' ),
				cell( '✓' ),
				cell( '✓' ),
			],
			[
				cell(
					__(
						'<strong>Custom Domain</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '✗' ),
				cell( '✓' ),
				cell( '✓' ),
			],
		],
	},
	{
		id: 'product-comparison',
		name: __( 'Product Comparison', 'wstech-visual-table-builder' ),
		description: __(
			'Side-by-side product feature comparison.',
			'wstech-visual-table-builder'
		),
		icon: '⚖️',
		settings: {
			hasHeaderRow: true,
			hoverHighlight: true,
			firstColumnHeader: true,
		},
		tableData: [
			[
				hdrAlt( __( 'Specification', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Product A', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Product B', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Product C', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Display</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '6.1" OLED', 'wstech-visual-table-builder' ) ),
				cell( __( '6.7" AMOLED', 'wstech-visual-table-builder' ) ),
				cell( __( '6.5" LCD', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Processor</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell(
					__( 'Snapdragon 8 Gen 3', 'wstech-visual-table-builder' )
				),
				cell( __( 'A17 Pro', 'wstech-visual-table-builder' ) ),
				cell( __( 'Dimensity 9200', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__( '<strong>RAM</strong>', 'wstech-visual-table-builder' )
				),
				cell( __( '8 GB', 'wstech-visual-table-builder' ) ),
				cell( __( '8 GB', 'wstech-visual-table-builder' ) ),
				cell( __( '12 GB', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Battery</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '4,500 mAh', 'wstech-visual-table-builder' ) ),
				cell( __( '4,422 mAh', 'wstech-visual-table-builder' ) ),
				cell( __( '5,000 mAh', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Price</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '₹64,999' ),
				cell( '₹79,900' ),
				cell( '₹44,999' ),
			],
			[
				cell(
					__(
						'<strong>Rating</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '⭐⭐⭐⭐½' ),
				cell( '⭐⭐⭐⭐⭐' ),
				cell( '⭐⭐⭐⭐' ),
			],
		],
	},
	{
		id: 'invoice',
		name: __( 'Invoice / Bill', 'wstech-visual-table-builder' ),
		description: __(
			'Professional invoice with items, quantities, and totals.',
			'wstech-visual-table-builder'
		),
		icon: '🧾',
		settings: { hasHeaderRow: true, hasFooterRow: true },
		tableData: [
			[
				hdr( '#' ),
				hdr( __( 'Item Description', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Qty', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Unit Price', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Total', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( '1' ),
				cell(
					__(
						'Website Design & Development',
						'wstech-visual-table-builder'
					)
				),
				cell( '1', { textAlign: 'center' } ),
				cell( '₹25,000', { textAlign: 'right' } ),
				cell( '₹25,000', { textAlign: 'right' } ),
			],
			[
				cell( '2' ),
				cell(
					__(
						'SEO Optimization Package',
						'wstech-visual-table-builder'
					)
				),
				cell( '1', { textAlign: 'center' } ),
				cell( '₹8,000', { textAlign: 'right' } ),
				cell( '₹8,000', { textAlign: 'right' } ),
			],
			[
				cell( '3' ),
				cell(
					__(
						'Monthly Maintenance (6 months)',
						'wstech-visual-table-builder'
					)
				),
				cell( '6', { textAlign: 'center' } ),
				cell( '₹2,000', { textAlign: 'right' } ),
				cell( '₹12,000', { textAlign: 'right' } ),
			],
			[
				cell( '4' ),
				cell( __( 'Logo Design', 'wstech-visual-table-builder' ) ),
				cell( '1', { textAlign: 'center' } ),
				cell( '₹5,000', { textAlign: 'right' } ),
				cell( '₹5,000', { textAlign: 'right' } ),
			],
			[
				cell(),
				cell(),
				cell(),
				cell(
					__(
						'<strong>Grand Total</strong>',
						'wstech-visual-table-builder'
					),
					{
						textAlign: 'right',
						fontWeight: 'bold',
					}
				),
				cell(
					__(
						'<strong>₹50,000</strong>',
						'wstech-visual-table-builder'
					),
					{
						textAlign: 'right',
						fontWeight: 'bold',
						backgroundColor: '#fef3c7',
					}
				),
			],
		],
	},
	{
		id: 'class-timetable',
		name: __( 'Class Timetable', 'wstech-visual-table-builder' ),
		description: __(
			'Weekly class or work schedule.',
			'wstech-visual-table-builder'
		),
		icon: '📅',
		settings: {
			hasHeaderRow: true,
			firstColumnHeader: true,
			hoverHighlight: true,
		},
		tableData: [
			[
				hdr( __( 'Time', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Monday', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Tuesday', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Wednesday', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Thursday', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Friday', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>9:00 AM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'Math', 'wstech-visual-table-builder' ) ),
				cell( __( 'English', 'wstech-visual-table-builder' ) ),
				cell( __( 'Science', 'wstech-visual-table-builder' ) ),
				cell( __( 'Math', 'wstech-visual-table-builder' ) ),
				cell( __( 'Hindi', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>10:00 AM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'Science', 'wstech-visual-table-builder' ) ),
				cell( __( 'Math', 'wstech-visual-table-builder' ) ),
				cell( __( 'English', 'wstech-visual-table-builder' ) ),
				cell( __( 'Hindi', 'wstech-visual-table-builder' ) ),
				cell( __( 'Math', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>11:00 AM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'English', 'wstech-visual-table-builder' ) ),
				cell( __( 'Science', 'wstech-visual-table-builder' ) ),
				cell( __( 'Hindi', 'wstech-visual-table-builder' ) ),
				cell( __( 'Computer', 'wstech-visual-table-builder' ) ),
				cell( __( 'Science', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>12:00 PM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '🍽 Lunch', 'wstech-visual-table-builder' ), {
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
				} ),
				cell( __( '🍽 Lunch', 'wstech-visual-table-builder' ), {
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
				} ),
				cell( __( '🍽 Lunch', 'wstech-visual-table-builder' ), {
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
				} ),
				cell( __( '🍽 Lunch', 'wstech-visual-table-builder' ), {
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
				} ),
				cell( __( '🍽 Lunch', 'wstech-visual-table-builder' ), {
					textAlign: 'center',
					backgroundColor: '#f0fdf4',
				} ),
			],
			[
				cell(
					__(
						'<strong>1:00 PM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'Computer', 'wstech-visual-table-builder' ) ),
				cell( __( 'Art', 'wstech-visual-table-builder' ) ),
				cell( __( 'PE', 'wstech-visual-table-builder' ) ),
				cell( __( 'Music', 'wstech-visual-table-builder' ) ),
				cell( __( 'Library', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>2:00 PM</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( 'PE', 'wstech-visual-table-builder' ) ),
				cell( __( 'Computer', 'wstech-visual-table-builder' ) ),
				cell( __( 'Art', 'wstech-visual-table-builder' ) ),
				cell( __( 'Science', 'wstech-visual-table-builder' ) ),
				cell( __( 'English', 'wstech-visual-table-builder' ) ),
			],
		],
	},
	{
		id: 'sports-standings',
		name: __( 'Sports Standings', 'wstech-visual-table-builder' ),
		description: __(
			'League table with wins, losses, and points.',
			'wstech-visual-table-builder'
		),
		icon: '🏆',
		settings: { hasHeaderRow: true, sortable: true, hoverHighlight: true },
		tableData: [
			[
				hdrGreen( __( 'Rank', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Team', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Played', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Won', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Drawn', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Lost', 'wstech-visual-table-builder' ) ),
				hdrGreen( __( 'Points', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( '1' ),
				cell(
					__(
						'<strong>Mumbai Indians</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '14' ),
				cell( '10' ),
				cell( '0' ),
				cell( '4' ),
				cell(
					__( '<strong>20</strong>', 'wstech-visual-table-builder' )
				),
			],
			[
				cell( '2' ),
				cell(
					__(
						'<strong>Chennai Super Kings</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( '14' ),
				cell( '9' ),
				cell( '0' ),
				cell( '5' ),
				cell(
					__( '<strong>18</strong>', 'wstech-visual-table-builder' )
				),
			],
			[
				cell( '3' ),
				cell(
					__( 'Royal Challengers', 'wstech-visual-table-builder' )
				),
				cell( '14' ),
				cell( '8' ),
				cell( '0' ),
				cell( '6' ),
				cell( '16' ),
			],
			[
				cell( '4' ),
				cell(
					__( 'Kolkata Knight Riders', 'wstech-visual-table-builder' )
				),
				cell( '14' ),
				cell( '7' ),
				cell( '0' ),
				cell( '7' ),
				cell( '14' ),
			],
			[
				cell( '5' ),
				cell( __( 'Delhi Capitals', 'wstech-visual-table-builder' ) ),
				cell( '14' ),
				cell( '6' ),
				cell( '0' ),
				cell( '8' ),
				cell( '12' ),
			],
		],
	},
	{
		id: 'project-tracker',
		name: __( 'Project Tracker', 'wstech-visual-table-builder' ),
		description: __(
			'Track tasks with status, priority, and deadlines.',
			'wstech-visual-table-builder'
		),
		icon: '📊',
		settings: {
			hasHeaderRow: true,
			sortable: true,
			searchable: true,
			hoverHighlight: true,
		},
		tableData: [
			[
				hdrAlt( __( 'Task', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Assignee', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Priority', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Status', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Deadline', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__( 'Homepage Redesign', 'wstech-visual-table-builder' )
				),
				cell( __( 'Arjun', 'wstech-visual-table-builder' ) ),
				cell( __( '🔴 High', 'wstech-visual-table-builder' ) ),
				cell( __( '🟡 In Progress', 'wstech-visual-table-builder' ), {
					backgroundColor: '#fef9c3',
				} ),
				cell( '2026-06-15' ),
			],
			[
				cell( __( 'API Integration', 'wstech-visual-table-builder' ) ),
				cell( __( 'Priya', 'wstech-visual-table-builder' ) ),
				cell( __( '🔴 High', 'wstech-visual-table-builder' ) ),
				cell( __( '🟢 Complete', 'wstech-visual-table-builder' ), {
					backgroundColor: '#dcfce7',
				} ),
				cell( '2026-06-10' ),
			],
			[
				cell(
					__( 'Mobile Responsive Fix', 'wstech-visual-table-builder' )
				),
				cell( __( 'Rahul', 'wstech-visual-table-builder' ) ),
				cell( __( '🟡 Medium', 'wstech-visual-table-builder' ) ),
				cell( __( '🟡 In Progress', 'wstech-visual-table-builder' ), {
					backgroundColor: '#fef9c3',
				} ),
				cell( '2026-06-20' ),
			],
			[
				cell( __( 'SEO Audit', 'wstech-visual-table-builder' ) ),
				cell( __( 'Sneha', 'wstech-visual-table-builder' ) ),
				cell( __( '🟡 Medium', 'wstech-visual-table-builder' ) ),
				cell( __( '🔵 Planned', 'wstech-visual-table-builder' ), {
					backgroundColor: '#dbeafe',
				} ),
				cell( '2026-06-25' ),
			],
			[
				cell(
					__( 'Analytics Dashboard', 'wstech-visual-table-builder' )
				),
				cell( __( 'Amit', 'wstech-visual-table-builder' ) ),
				cell( __( '🟢 Low', 'wstech-visual-table-builder' ) ),
				cell( __( '🔵 Planned', 'wstech-visual-table-builder' ), {
					backgroundColor: '#dbeafe',
				} ),
				cell( '2026-07-01' ),
			],
		],
	},
	{
		id: 'budget-tracker',
		name: __( 'Budget Tracker', 'wstech-visual-table-builder' ),
		description: __(
			'Monthly income and expense tracker.',
			'wstech-visual-table-builder'
		),
		icon: '💼',
		settings: {
			hasHeaderRow: true,
			hasFooterRow: true,
			hoverHighlight: true,
		},
		tableData: [
			[
				hdr( __( 'Category', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Budget (₹)', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Actual (₹)', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Variance (₹)', 'wstech-visual-table-builder' ) ),
				hdr( __( 'Status', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Salary', 'wstech-visual-table-builder' ) ),
				cell( '50,000', { textAlign: 'right' } ),
				cell( '50,000', { textAlign: 'right' } ),
				cell( '0', { textAlign: 'right' } ),
				cell( __( '✅ On Track', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Rent', 'wstech-visual-table-builder' ) ),
				cell( '12,000', { textAlign: 'right' } ),
				cell( '12,000', { textAlign: 'right' } ),
				cell( '0', { textAlign: 'right' } ),
				cell( __( '✅ On Track', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Groceries', 'wstech-visual-table-builder' ) ),
				cell( '8,000', { textAlign: 'right' } ),
				cell( '9,200', { textAlign: 'right' } ),
				cell( '-1,200', { textAlign: 'right', color: '#dc2626' } ),
				cell( __( '⚠️ Over Budget', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Transport', 'wstech-visual-table-builder' ) ),
				cell( '3,000', { textAlign: 'right' } ),
				cell( '2,500', { textAlign: 'right' } ),
				cell( '+500', { textAlign: 'right', color: '#16a34a' } ),
				cell( __( '✅ Under Budget', 'wstech-visual-table-builder' ) ),
			],
			[
				cell( __( 'Utilities', 'wstech-visual-table-builder' ) ),
				cell( '4,000', { textAlign: 'right' } ),
				cell( '3,800', { textAlign: 'right' } ),
				cell( '+200', { textAlign: 'right', color: '#16a34a' } ),
				cell( __( '✅ Under Budget', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Total</strong>',
						'wstech-visual-table-builder'
					),
					{
						fontWeight: 'bold',
					}
				),
				cell(
					__(
						'<strong>77,000</strong>',
						'wstech-visual-table-builder'
					),
					{
						textAlign: 'right',
						fontWeight: 'bold',
					}
				),
				cell(
					__(
						'<strong>77,500</strong>',
						'wstech-visual-table-builder'
					),
					{
						textAlign: 'right',
						fontWeight: 'bold',
					}
				),
				cell(
					__(
						'<strong>-500</strong>',
						'wstech-visual-table-builder'
					),
					{
						textAlign: 'right',
						fontWeight: 'bold',
						color: '#dc2626',
					}
				),
				cell(
					__(
						'<strong>⚠️ Slightly Over</strong>',
						'wstech-visual-table-builder'
					),
					{
						fontWeight: 'bold',
					}
				),
			],
		],
	},
	{
		id: 'nutrition-facts',
		name: __( 'Nutrition Facts', 'wstech-visual-table-builder' ),
		description: __(
			'Nutritional information table for food products.',
			'wstech-visual-table-builder'
		),
		icon: '🥗',
		settings: { hasHeaderRow: true, firstColumnHeader: true },
		tableData: [
			[
				hdrAlt( __( 'Nutrient', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( 'Per 100g', 'wstech-visual-table-builder' ) ),
				hdrAlt( __( '% Daily Value', 'wstech-visual-table-builder' ) ),
			],
			[
				cell(
					__(
						'<strong>Calories</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '250 kcal', 'wstech-visual-table-builder' ) ),
				cell( '12%' ),
			],
			[
				cell(
					__(
						'<strong>Total Fat</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '8g', 'wstech-visual-table-builder' ) ),
				cell( '10%' ),
			],
			[
				cell(
					__(
						'<strong>Saturated Fat</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '3g', 'wstech-visual-table-builder' ) ),
				cell( '15%' ),
			],
			[
				cell(
					__(
						'<strong>Cholesterol</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '30mg', 'wstech-visual-table-builder' ) ),
				cell( '10%' ),
			],
			[
				cell(
					__(
						'<strong>Sodium</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '480mg', 'wstech-visual-table-builder' ) ),
				cell( '21%' ),
			],
			[
				cell(
					__(
						'<strong>Total Carbohydrates</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '37g', 'wstech-visual-table-builder' ) ),
				cell( '13%' ),
			],
			[
				cell(
					__(
						'<strong>Dietary Fiber</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '4g', 'wstech-visual-table-builder' ) ),
				cell( '14%' ),
			],
			[
				cell(
					__(
						'<strong>Protein</strong>',
						'wstech-visual-table-builder'
					)
				),
				cell( __( '12g', 'wstech-visual-table-builder' ) ),
				cell( '24%' ),
			],
		],
	},
];
