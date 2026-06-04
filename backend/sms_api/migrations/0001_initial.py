from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_id', models.CharField(max_length=128, unique=True)),
                ('amount', models.BigIntegerField(help_text='Amount in paise')),
                ('currency', models.CharField(default='INR', max_length=8)),
                ('receipt', models.CharField(blank=True, max_length=128, null=True)),
                ('status', models.CharField(choices=[('CREATED', 'Created'), ('PAID', 'Paid'), ('FAILED', 'Failed')], default='CREATED', max_length=16)),
                ('razorpay_payment_id', models.CharField(blank=True, max_length=128, null=True)),
                ('razorpay_signature', models.CharField(blank=True, max_length=256, null=True)),
                ('raw_response', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
