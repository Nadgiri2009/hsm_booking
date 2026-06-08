from django.contrib import admin
from django.http import HttpResponse
import csv

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'username', 'role', 'action', 'entity', 'entity_id')
    list_filter = ('action', 'role', 'created_at')
    search_fields = ('username', 'entity', 'entity_id', 'remarks')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    actions = ['export_as_csv']

    def export_as_csv(self, request, queryset):
        """Admin action to export selected audit logs as CSV."""
        meta = self.model._meta
        field_names = ['created_at', 'username', 'role', 'action', 'entity', 'entity_id', 'ip_address', 'remarks']

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename=audit_logs.csv'
        writer = csv.writer(response)

        writer.writerow(field_names)
        for obj in queryset:
            row = [getattr(obj, f) for f in field_names]
            writer.writerow(row)
        return response

    export_as_csv.short_description = "Export selected audit logs as CSV"
    
    def export_as_excel(self, request, queryset):
        # Simple Excel-compatible CSV stream (Content-Type for Excel)
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = 'attachment; filename=audit_logs.xls'
        writer = csv.writer(response)
        field_names = ['created_at', 'username', 'role', 'action', 'entity', 'entity_id', 'ip_address', 'remarks']
        writer.writerow(field_names)
        for obj in queryset:
            row = [getattr(obj, f) for f in field_names]
            writer.writerow(row)
        return response

    export_as_excel.short_description = "Export selected audit logs as Excel"
    actions += ['export_as_excel']
